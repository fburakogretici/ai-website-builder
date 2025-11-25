import { NextRequest, NextResponse } from 'next/server';
import Iyzipay from 'iyzipay';
import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/types/subscription';

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY!,
  secretKey: process.env.IYZICO_SECRET_KEY!,
  uri: process.env.NODE_ENV === 'production' 
    ? 'https://api.iyzipay.com' 
    : 'https://sandbox-api.iyzipay.com'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return NextResponse.redirect(new URL('/pricing?error=missing_token', process.env.NEXT_PUBLIC_APP_URL!));
    }

    // Retrieve payment result from iyzico
    const retrieveRequest = {
      locale: 'en',
      conversationId: '',
      token,
    };

    return new Promise<Response>((resolve) => {
      iyzipay.checkoutForm.retrieve(retrieveRequest, async (err: Error | null, result: {
        status: string;
        paymentStatus?: string;
        conversationId?: string;
        basketId?: string;
        price?: number;
        paidPrice?: number;
        currency?: string;
        paymentId?: string;
        errorMessage?: string;
      }) => {
        if (err) {
          console.error('iyzico retrieve error:', err);
          resolve(NextResponse.redirect(new URL('/pricing?error=payment_failed', process.env.NEXT_PUBLIC_APP_URL!)));
          return;
        }

        if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
          console.error('Payment not successful:', result);
          resolve(NextResponse.redirect(new URL(`/pricing?error=${result.errorMessage || 'payment_failed'}`, process.env.NEXT_PUBLIC_APP_URL!)));
          return;
        }

        // Get pending payment info
        const { data: pendingPayment } = await supabase
          .from('pending_payments')
          .select('*')
          .eq('basket_id', result.basketId)
          .single();

        if (!pendingPayment) {
          console.error('Pending payment not found');
          resolve(NextResponse.redirect(new URL('/pricing?error=payment_not_found', process.env.NEXT_PUBLIC_APP_URL!)));
          return;
        }

        const userId = pendingPayment.user_id;
        const planId = pendingPayment.plan_id as SubscriptionTier;
        const billingPeriod = pendingPayment.billing_period;
        const plan = SUBSCRIPTION_PLANS[planId];

        // Calculate subscription period
        const now = new Date();
        const periodEnd = new Date();
        if (billingPeriod === 'monthly') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Update user subscription
        await supabase.from('profiles').update({
          subscription_tier: planId,
          subscription_status: 'active',
          credits_monthly: plan.monthlyCredits,
          daily_credits_remaining: plan.dailyCredits,
          credits_used_this_month: 0,
          subscription_period_start: now.toISOString(),
          subscription_period_end: periodEnd.toISOString(),
        }).eq('id', userId);

        // Record payment
        await supabase.from('payments').insert({
          user_id: userId,
          iyzico_payment_id: result.paymentId,
          amount: result.paidPrice,
          currency: result.currency,
          status: 'completed',
          type: 'subscription',
          plan_id: planId,
          billing_period: billingPeriod,
          metadata: {
            basket_id: result.basketId,
            conversation_id: result.conversationId,
          },
        });

        // Log credit transaction
        await supabase.from('credit_transactions').insert({
          user_id: userId,
          amount: plan.monthlyCredits,
          type: 'subscription',
          description: `${plan.name} subscription activated - ${plan.monthlyCredits} credits added`,
          metadata: {
            payment_id: result.paymentId,
            plan_id: planId,
          },
        });

        // Update pending payment status
        await supabase.from('pending_payments').update({
          status: 'completed',
          iyzico_payment_id: result.paymentId,
        }).eq('basket_id', result.basketId);

        // Redirect to success page
        resolve(NextResponse.redirect(new URL('/dashboard?subscription=success', process.env.NEXT_PUBLIC_APP_URL!)));
      });
    });

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(new URL('/pricing?error=callback_failed', process.env.NEXT_PUBLIC_APP_URL!));
  }
}

// Also handle GET for redirect-based callbacks
export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/pricing?error=missing_token', process.env.NEXT_PUBLIC_APP_URL!));
  }

  // Create a form data with token and call POST
  const formData = new FormData();
  formData.append('token', token);
  
  const result = await POST(new NextRequest(request.url, {
    method: 'POST',
    body: formData,
  }));
  
  return result as Response;
}
