import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  CREDIT_COSTS, 
  SUBSCRIPTION_PLANS,
  calculateTotalCredits,
  SubscriptionTier 
} from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, metadata } = body;

    // Validate operation
    if (!operation || !(operation in CREDIT_COSTS)) {
      return NextResponse.json(
        { error: 'Invalid operation' },
        { status: 400 }
      );
    }

    const creditCost = CREDIT_COSTS[operation as keyof typeof CREDIT_COSTS];

    // Get user's current credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        subscription_tier,
        credits_monthly,
        credits_bonus,
        credits_purchased,
        credits_used_this_month,
        daily_credits_remaining
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const tier = (profile.subscription_tier || 'free') as SubscriptionTier;
    const plan = SUBSCRIPTION_PLANS[tier];

    // Enterprise has unlimited credits
    if (tier === 'enterprise') {
      // Log the transaction but don't deduct
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -creditCost,
        type: 'usage',
        description: `${operation} (Enterprise - unlimited)`,
        metadata: metadata || {},
      });

      return NextResponse.json({
        success: true,
        creditsUsed: creditCost,
        creditsRemaining: -1, // Unlimited
      });
    }

    // Calculate available credits
    const available = {
      monthly: (profile.credits_monthly ?? plan.monthlyCredits) - (profile.credits_used_this_month ?? 0),
      bonus: profile.credits_bonus ?? 0,
      purchased: profile.credits_purchased ?? 0,
      daily: profile.daily_credits_remaining ?? 0,
    };

    const totalAvailable = available.monthly + available.bonus + available.purchased + available.daily;

    if (totalAvailable < creditCost) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: creditCost,
          available: totalAvailable,
        },
        { status: 402 } // Payment Required
      );
    }

    // Deduct credits in order: daily → monthly → bonus → purchased
    let remaining = creditCost;
    const updates: Record<string, number> = {};

    // 1. Use daily credits first
    if (remaining > 0 && available.daily > 0) {
      const deduct = Math.min(remaining, available.daily);
      updates.daily_credits_remaining = (profile.daily_credits_remaining ?? 0) - deduct;
      remaining -= deduct;
    }

    // 2. Use monthly credits
    if (remaining > 0 && available.monthly > 0) {
      const deduct = Math.min(remaining, available.monthly);
      updates.credits_used_this_month = (profile.credits_used_this_month ?? 0) + deduct;
      remaining -= deduct;
    }

    // 3. Use bonus credits
    if (remaining > 0 && available.bonus > 0) {
      const deduct = Math.min(remaining, available.bonus);
      updates.credits_bonus = (profile.credits_bonus ?? 0) - deduct;
      remaining -= deduct;
    }

    // 4. Use purchased credits
    if (remaining > 0 && available.purchased > 0) {
      const deduct = Math.min(remaining, available.purchased);
      updates.credits_purchased = (profile.credits_purchased ?? 0) - deduct;
      remaining -= deduct;
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update credits:', updateError);
      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      );
    }

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -creditCost,
      type: 'usage',
      description: operation,
      metadata: metadata || {},
    });

    // Calculate new total
    const newTotal = totalAvailable - creditCost;

    return NextResponse.json({
      success: true,
      creditsUsed: creditCost,
      creditsRemaining: newTotal,
    });

  } catch (error) {
    console.error('Credits use error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
