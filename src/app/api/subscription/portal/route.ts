import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Get Stripe instance
    const stripeInstance = await getStripe();

    if (!stripeInstance) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 503 }
      );
    }

    // Create customer portal session
    const session = await stripeInstance.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
