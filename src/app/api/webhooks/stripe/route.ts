import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId as SubscriptionTier;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get plan details
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    console.error('Invalid plan ID:', planId);
    return;
  }

  // Update user subscription in database
  const now = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    tier: planId,
    status: 'active',
    stripe_subscription_id: session.subscription as string,
    stripe_customer_id: session.customer as string,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    monthly_credits: plan.monthlyCredits,
    daily_credits: plan.dailyCredits,
    updated_at: now.toISOString(),
  }, {
    onConflict: 'user_id',
  });

  // Add initial credits
  await supabase.from('user_credits').upsert({
    user_id: userId,
    monthly_credits: plan.monthlyCredits,
    daily_credits: plan.dailyCredits,
    bonus_credits: 0,
    purchased_credits: 0,
    last_daily_reset: now.toISOString(),
    last_monthly_reset: now.toISOString(),
    updated_at: now.toISOString(),
  }, {
    onConflict: 'user_id',
  });

  // Log the transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: plan.monthlyCredits,
    type: 'subscription_credit',
    description: `${plan.name} subscription started - ${plan.monthlyCredits} monthly credits added`,
    metadata: {
      plan_id: planId,
      subscription_id: session.subscription,
    },
  });

  console.log(`Subscription activated for user ${userId}: ${planId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId as SubscriptionTier;

  if (!userId) {
    // Try to find user by customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single();

    if (!profile) {
      console.error('User not found for subscription update');
      return;
    }

    // Update with found user ID
    await updateSubscriptionInDB(profile.id, subscription, planId);
    return;
  }

  await updateSubscriptionInDB(userId, subscription, planId);
}

async function updateSubscriptionInDB(
  userId: string,
  subscription: Stripe.Subscription,
  planId?: SubscriptionTier
) {
  const status = subscription.status === 'active' || subscription.status === 'trialing'
    ? 'active'
    : subscription.status === 'past_due'
    ? 'past_due'
    : 'inactive';

  // Get period dates from subscription items
  const periodStart = (subscription as unknown as { current_period_start?: number }).current_period_start;
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    tier: planId || 'free',
    status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id',
  });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!sub) {
    console.error('Subscription not found in database');
    return;
  }

  // Update to free tier
  await supabase.from('subscriptions').update({
    tier: 'free',
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  }).eq('user_id', sub.user_id);

  // Reset credits to free tier
  const freePlan = SUBSCRIPTION_PLANS.free;
  await supabase.from('user_credits').update({
    monthly_credits: freePlan.monthlyCredits,
    daily_credits: freePlan.dailyCredits,
    updated_at: new Date().toISOString(),
  }).eq('user_id', sub.user_id);

  // Log the cancellation
  await supabase.from('credit_transactions').insert({
    user_id: sub.user_id,
    amount: 0,
    type: 'subscription_cancel',
    description: 'Subscription cancelled - downgraded to free tier',
    metadata: {
      subscription_id: subscription.id,
    },
  });

  console.log(`Subscription cancelled for user ${sub.user_id}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as { subscription?: string | null }).subscription;
  if (!subscriptionId) return;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const planId = subscription.metadata?.planId as SubscriptionTier;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!sub) return;

  const plan = planId ? SUBSCRIPTION_PLANS[planId] : null;
  if (!plan) return;

  // Refresh monthly credits
  await supabase.from('user_credits').update({
    monthly_credits: plan.monthlyCredits,
    last_monthly_reset: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', sub.user_id);

  // Log the renewal
  await supabase.from('credit_transactions').insert({
    user_id: sub.user_id,
    amount: plan.monthlyCredits,
    type: 'subscription_renewal',
    description: `${plan.name} subscription renewed - ${plan.monthlyCredits} monthly credits refreshed`,
    metadata: {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
    },
  });

  console.log(`Invoice paid and credits refreshed for user ${sub.user_id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as { subscription?: string | null }).subscription;
  if (!subscriptionId) return;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!sub) return;

  // Update subscription status
  await supabase.from('subscriptions').update({
    status: 'past_due',
    updated_at: new Date().toISOString(),
  }).eq('user_id', sub.user_id);

  // Log the failure
  await supabase.from('credit_transactions').insert({
    user_id: sub.user_id,
    amount: 0,
    type: 'payment_failed',
    description: 'Payment failed - subscription may be suspended',
    metadata: {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
    },
  });

  // TODO: Send email notification to user about payment failure

  console.log(`Payment failed for user ${sub.user_id}`);
}
