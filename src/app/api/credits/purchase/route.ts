import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { CREDIT_PACKAGES } from '@/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe Price IDs for credit packages
const STRIPE_CREDIT_PRICES: Record<string, string> = {
  credits_50: process.env.STRIPE_PRICE_CREDITS_50 || 'price_credits_50',
  credits_150: process.env.STRIPE_PRICE_CREDITS_150 || 'price_credits_150',
  credits_500: process.env.STRIPE_PRICE_CREDITS_500 || 'price_credits_500',
  credits_1000: process.env.STRIPE_PRICE_CREDITS_1000 || 'price_credits_1000',
};

export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
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
    const { packageId } = body as { packageId: string };

    // Validate package
    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = profile?.email || authUser?.user?.email;

      if (!email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 400 }
        );
      }

      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });

      stripeCustomerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Get price ID
    const priceId = STRIPE_CREDIT_PRICES[packageId];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not found' },
        { status: 400 }
      );
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/{locale}/dashboard?credits=success&package=${packageId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/{locale}/pricing?credits=cancelled`,
      metadata: {
        userId,
        packageId,
        credits: creditPackage.credits.toString(),
        type: 'credit_purchase',
      },
      allow_promotion_codes: true,
      locale: request.headers.get('accept-language')?.includes('tr') ? 'tr' : 'en',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create credit checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
