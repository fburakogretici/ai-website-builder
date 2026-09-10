import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  UserCredits, 
  SUBSCRIPTION_PLANS, 
  calculateTotalCredits,
  SubscriptionTier 
} from '@/types/subscription';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's credit info from profiles/users table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        subscription_tier,
        credits_monthly,
        credits_bonus,
        credits_purchased,
        credits_used_this_month,
        daily_credits_remaining,
        subscription_period_end
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, return default free tier credits
      const defaultCredits: UserCredits = {
        monthly: SUBSCRIPTION_PLANS.free.monthlyCredits,
        bonus: 0,
        purchased: 0,
        usedThisMonth: 0,
        dailyRemaining: 0,
        total: SUBSCRIPTION_PLANS.free.monthlyCredits,
      };
      
      return NextResponse.json({
        credits: defaultCredits,
        plan: 'free',
        periodEnd: null,
      });
    }

    const tier = (profile.subscription_tier || 'free') as SubscriptionTier;
    const plan = SUBSCRIPTION_PLANS[tier];
    
    const credits: UserCredits = {
      monthly: profile.credits_monthly ?? plan.monthlyCredits,
      bonus: profile.credits_bonus ?? 0,
      purchased: profile.credits_purchased ?? 0,
      usedThisMonth: profile.credits_used_this_month ?? 0,
      dailyRemaining: profile.daily_credits_remaining ?? 0,
      total: 0,
    };
    
    credits.total = calculateTotalCredits(credits);

    return NextResponse.json({
      credits,
      plan: tier,
      periodEnd: profile.subscription_period_end,
    });

  } catch (error) {
    console.error('Credits balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
