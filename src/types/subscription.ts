// Subscription & Credit Types

export type SubscriptionTier = 'free' | 'pro' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type BillingPeriod = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCredits: number;
  dailyCredits: number;
  maxRollover: number;
  features: string[];
  limits: {
    websites: number;
    teamMembers: number;
    customDomains: boolean;
    removeBadge: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
  stripePriceIds: {
    monthly: string | null;
    yearly: string | null;
  };
}

export interface UserCredits {
  monthly: number;         // Bu ayın abonelik kredileri
  bonus: number;           // Bonus krediler
  purchased: number;       // Satın alınan krediler
  usedThisMonth: number;   // Bu ay kullanılan
  dailyRemaining: number;  // Kalan günlük krediler
  total: number;           // Toplam kullanılabilir
}

// API Response type
export interface CreditsResponse {
  credits: UserCredits;
  plan: SubscriptionTier;
  periodEnd: string | null;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'subscription' | 'purchase' | 'usage' | 'bonus' | 'refund' | 'rollover';
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
  stripePriceId: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  plan: SubscriptionTier;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Credit costs for different operations
export const CREDIT_COSTS = {
  WEBSITE_CREATE: 10,
  WEBSITE_EDIT_SMALL: 2,
  WEBSITE_EDIT_MEDIUM: 5,
  WEBSITE_EDIT_LARGE: 8,
  WEBSITE_REDESIGN: 15,
  TEMPLATE_CUSTOMIZE: 3,
  SEO_OPTIMIZE: 5,
  CONTENT_GENERATE: 3,
} as const;

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyCredits: 50,
    dailyCredits: 0,
    maxRollover: 0,
    features: [
      '50 AI credits/month',
      '1 website',
      'Basic templates',
      'Subdomain (site.nocodepage.tech)',
      'Email support',
    ],
    limits: {
      websites: 1,
      teamMembers: 1,
      customDomains: false,
      removeBadge: false,
      apiAccess: false,
      prioritySupport: false,
    },
    stripePriceIds: {
      monthly: null,
      yearly: null,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For individuals and creators',
    monthlyPrice: 9,
    yearlyPrice: 90,
    monthlyCredits: 100,
    dailyCredits: 5,
    maxRollover: 200,
    features: [
      '100 AI credits/month + 5 daily',
      '5 websites',
      'All templates',
      'Credit rollover',
      'Custom domain',
      'Remove badge',
      'Priority support',
    ],
    limits: {
      websites: 5,
      teamMembers: 1,
      customDomains: true,
      removeBadge: true,
      apiAccess: false,
      prioritySupport: true,
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For teams and agencies',
    monthlyPrice: 19,
    yearlyPrice: 190,
    monthlyCredits: 250,
    dailyCredits: 10,
    maxRollover: 500,
    features: [
      '250 AI credits/month + 10 daily',
      '20 websites',
      'Team members (5)',
      'User roles & permissions',
      'SSO integration',
      'API access',
      'Advanced analytics',
    ],
    limits: {
      websites: 20,
      teamMembers: 5,
      customDomains: true,
      removeBadge: true,
      apiAccess: true,
      prioritySupport: true,
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: -1, // Custom pricing
    yearlyPrice: -1,
    monthlyCredits: -1, // Unlimited
    dailyCredits: -1,
    maxRollover: -1,
    features: [
      'Unlimited AI credits',
      'Unlimited websites',
      'Unlimited team members',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'White-label option',
      'Onboarding service',
    ],
    limits: {
      websites: -1, // Unlimited
      teamMembers: -1,
      customDomains: true,
      removeBadge: true,
      apiAccess: true,
      prioritySupport: true,
    },
    stripePriceIds: {
      monthly: null,
      yearly: null,
    },
  },
};

// Credit packages for purchase (USD)
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 5,
    pricePerCredit: 0.10,
    stripePriceId: process.env.IYZICO_CREDITS_50_PRICE_ID || '',
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 150,
    price: 12,
    pricePerCredit: 0.08,
    popular: true,
    stripePriceId: process.env.IYZICO_CREDITS_150_PRICE_ID || '',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 35,
    pricePerCredit: 0.07,
    stripePriceId: process.env.IYZICO_CREDITS_500_PRICE_ID || '',
  },
  {
    id: 'mega',
    name: 'Mega',
    credits: 1000,
    price: 59,
    pricePerCredit: 0.059,
    stripePriceId: process.env.IYZICO_CREDITS_1000_PRICE_ID || '',
  },
];

// Helper function to calculate total available credits
export function calculateTotalCredits(credits: Omit<UserCredits, 'total'>): number {
  return credits.monthly - credits.usedThisMonth + credits.bonus + credits.purchased + credits.dailyRemaining;
}

// Helper function to check if user has enough credits
export function hasEnoughCredits(userCredits: UserCredits, required: number): boolean {
  return userCredits.total >= required;
}
