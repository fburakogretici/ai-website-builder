import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionTier } from '@/types/subscription';

// Lazy load Stripe to avoid build-time issues
let Stripe: any;
let stripe: any;

async function getStripe() {
  if (!Stripe) {
    Stripe = (await import('stripe')).default;
  }
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe Price IDs - bunları Stripe Dashboard'dan alacaksınız
const STRIPE_PRICES: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü - cookie'den user ID al
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    // Supabase auth token'ı cookie'den al
    let userId: string | null = null;

    if (cookieHeader) {
      const supabaseAuthToken = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('sb-'))
        ?.split('=')[1];

      if (supabaseAuthToken) {
        try {
          const decoded = JSON.parse(decodeURIComponent(supabaseAuthToken));
          userId = decoded?.user?.id;
        } catch {
          // Token parse edilemedi
        }
      }
    }

    // Eğer cookie'den alamadıysak, header'dan dene
    if (!userId && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, billingPeriod } = body as {
      planId: SubscriptionTier;
      billingPeriod: 'monthly' | 'yearly';
    };

    // Validate plan
    if (!['pro', 'business'].includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get user email from Supabase
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    let stripeCustomerId = userData?.stripe_customer_id;

    // Create or get Stripe customer
    if (!stripeCustomerId) {
      // Get user email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.email || authUser?.user?.email;

      if (!email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        );
      }

      const stripeInstance = await getStripe();

      if (!stripeInstance) {
        return NextResponse.json(
          { error: 'Payment provider not configured' },
          { status: 503 }
        );
      }

      const customer = await stripeInstance.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      stripeCustomerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Get price ID
    const priceId = STRIPE_PRICES[planId]?.[billingPeriod];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not found' },
        { status: 400 }
      );
    }

    const stripeInstance = await getStripe();

    if (!stripeInstance) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 503 }
      );
    }

    // Create checkout session
    const session = await stripeInstance.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/{locale}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/{locale}/pricing?subscription=cancelled`,
      metadata: {
        userId,
        planId,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: request.headers.get('accept-language')?.includes('tr') ? 'tr' : 'en',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
