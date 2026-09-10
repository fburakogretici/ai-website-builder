import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/types/subscription';
import { generateConversationId, generateBasketId } from '@/lib/iyzico';

// Lazy load iyzipay to avoid build-time issues
let Iyzipay: any;
let iyzipay: any;

async function getIyzipay() {
  if (!Iyzipay) {
    Iyzipay = (await import('iyzipay')).default;
  }
  if (!iyzipay) {
    iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY!,
      secretKey: process.env.IYZICO_SECRET_KEY!,
      uri: process.env.NODE_ENV === 'production'
        ? 'https://api.iyzipay.com'
        : 'https://sandbox-api.iyzipay.com'
    });
  }
  return iyzipay;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingPeriod } = body as {
      planId: SubscriptionTier;
      billingPeriod: 'monthly' | 'yearly';
    };

    // Validate plan
    if (!['pro', 'business'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const userEmail = profile?.email || user.email || '';
    const userName = profile?.full_name || userEmail.split('@')[0] || 'User';
    const nameParts = userName.split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    const conversationId = generateConversationId();
    const basketId = generateBasketId(user.id, `subscription_${planId}_${billingPeriod}`);

    // Create iyzico checkout form
    const checkoutRequest = {
      locale: 'en',
      conversationId,
      price: price.toFixed(2),
      paidPrice: price.toFixed(2),
      currency: 'USD' as const,
      basketId,
      paymentGroup: 'SUBSCRIPTION' as const,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`,
      enabledInstallments: [1], // Only single payment for subscriptions
      buyer: {
        id: user.id,
        name: firstName,
        surname: lastName,
        gsmNumber: '+905000000000', // Placeholder - could be from profile
        email: userEmail,
        identityNumber: '11111111111', // Placeholder - required by iyzico
        registrationAddress: 'Online',
        ip,
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: userName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Digital Product - No Shipping',
      },
      billingAddress: {
        contactName: userName,
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Digital Product',
      },
      basketItems: [
        {
          id: `${planId}_${billingPeriod}`,
          name: `${plan.name} Plan (${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'})`,
          category1: 'Subscription',
          category2: 'AI Website Builder',
          itemType: 'VIRTUAL' as const,
          price: price.toFixed(2),
        },
      ],
    };

    // Store pending payment info
    await supabase.from('pending_payments').upsert({
      user_id: user.id,
      conversation_id: conversationId,
      basket_id: basketId,
      plan_id: planId,
      billing_period: billingPeriod,
      amount: price,
      currency: 'USD',
      status: 'pending',
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

    // Create checkout form
    const iyzipayInstance = await getIyzipay();

    return new Promise<Response>((resolve) => {
      iyzipayInstance.checkoutFormInitialize.create(checkoutRequest, (err: Error | null, result: { status: string; checkoutFormContent?: string; paymentPageUrl?: string; errorMessage?: string }) => {
        if (err) {
          console.error('iyzico error:', err);
          resolve(NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 }));
          return;
        }

        if (result.status !== 'success') {
          console.error('iyzico result error:', result);
          resolve(NextResponse.json({ error: result.errorMessage || 'Payment failed' }, { status: 400 }));
          return;
        }

        resolve(NextResponse.json({
          checkoutFormContent: result.checkoutFormContent,
          paymentPageUrl: result.paymentPageUrl,
          conversationId,
        }));
      });
    });

  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
