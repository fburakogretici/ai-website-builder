"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS, CREDIT_PACKAGES, SubscriptionTier } from "@/types/subscription";
import { toast } from "sonner";

export default function PricingPage() {
  const locale = useLocale();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const plans = Object.values(SUBSCRIPTION_PLANS);

  const handleSelectPlan = async (planId: SubscriptionTier) => {
    if (planId === 'free') {
      router.push(`/${locale}/dashboard`);
      return;
    }

    if (planId === 'enterprise') {
      // Open contact form or email
      window.location.href = 'mailto:enterprise@nocodepage.ai?subject=Enterprise Plan Inquiry';
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      const response = await fetch('/api/payment/iyzico/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingPeriod,
        }),
      });

      const data = await response.json();

      if (data.checkoutFormContent) {
        // Open iyzico payment modal
        const paymentDiv = document.createElement('div');
        paymentDiv.innerHTML = data.checkoutFormContent;
        document.body.appendChild(paymentDiv);

        // Execute iyzico scripts
        const scripts = paymentDiv.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
          const script = document.createElement('script');
          script.text = scripts[i].text;
          document.head.appendChild(script);
        }
      } else if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(locale === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price === -1) return 'Custom';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getYearlySavings = (monthly: number, yearly: number) => {
    if (monthly <= 0 || yearly <= 0) return 0;
    const yearlyMonthly = yearly / 12;
    return Math.round(((monthly - yearlyMonthly) / monthly) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="pt-20 pb-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {locale === 'tr' ? 'Basit, Şeffaf Fiyatlandırma' : 'Simple, Transparent Pricing'}
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          {locale === 'tr'
            ? 'Ücretsiz başlayın. İhtiyacınız oldukça büyüyün.'
            : 'Start for free. Scale as you grow.'}
        </p>

        {/* Billing Toggle */}
        <div className="mt-10 inline-flex items-center gap-4 bg-slate-800/50 p-1.5 rounded-xl">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${billingPeriod === 'monthly'
              ? 'bg-white text-slate-900'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            {locale === 'tr' ? 'Aylık' : 'Monthly'}
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${billingPeriod === 'yearly'
              ? 'bg-white text-slate-900'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            {locale === 'tr' ? 'Yıllık' : 'Yearly'}
            <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
              {locale === 'tr' ? '2 ay bedava' : '2 months free'}
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const isPopular = plan.id === 'pro';
            const isEnterprise = plan.id === 'enterprise';
            const savings = getYearlySavings(plan.monthlyPrice, plan.yearlyPrice);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${isPopular
                  ? 'bg-gradient-to-br from-violet-600 to-purple-700 ring-2 ring-violet-400 scale-105 shadow-2xl shadow-violet-500/20'
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 text-xs font-bold px-4 py-1 rounded-full">
                      {locale === 'tr' ? 'EN POPÜLER' : 'MOST POPULAR'}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${isPopular ? 'text-white' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mt-1 ${isPopular ? 'text-violet-200' : 'text-slate-400'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-white'}`}>
                      {formatPrice(billingPeriod === 'yearly' && !isEnterprise ? Math.round(price / 12) : price)}
                    </span>
                    {!isEnterprise && price > 0 && (
                      <span className={`text-sm mb-1 ${isPopular ? 'text-violet-200' : 'text-slate-400'}`}>
                        /{locale === 'tr' ? 'ay' : 'mo'}
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && savings > 0 && !isEnterprise && (
                    <p className={`text-sm mt-1 ${isPopular ? 'text-violet-200' : 'text-emerald-400'}`}>
                      {locale === 'tr' ? `Yıllık faturalamada %${savings} tasarruf` : `Save ${savings}% with yearly billing`}
                    </p>
                  )}
                </div>

                {/* Credits Info */}
                <div className={`mb-6 p-3 rounded-lg ${isPopular ? 'bg-white/10' : 'bg-slate-700/30'}`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-5 h-5 ${isPopular ? 'text-violet-200' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className={`text-sm font-medium ${isPopular ? 'text-white' : 'text-slate-300'}`}>
                      {plan.monthlyCredits === -1
                        ? (locale === 'tr' ? 'Sınırsız kredi' : 'Unlimited credits')
                        : `${plan.monthlyCredits} ${locale === 'tr' ? 'kredi/ay' : 'credits/mo'}`
                      }
                    </span>
                  </div>
                  {plan.dailyCredits > 0 && (
                    <p className={`text-xs mt-1 ${isPopular ? 'text-violet-200' : 'text-slate-400'}`}>
                      + {plan.dailyCredits} {locale === 'tr' ? 'günlük ekstra' : 'daily bonus'}
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className={`w-5 h-5 flex-shrink-0 ${isPopular ? 'text-violet-200' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm ${isPopular ? 'text-white' : 'text-slate-300'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading && selectedPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isPopular
                    ? 'bg-white text-violet-700 hover:bg-violet-50'
                    : plan.id === 'free'
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500'
                    } disabled:opacity-50`}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : plan.id === 'free' ? (
                    locale === 'tr' ? 'Ücretsiz Başla' : 'Start Free'
                  ) : plan.id === 'enterprise' ? (
                    locale === 'tr' ? 'İletişime Geç' : 'Contact Sales'
                  ) : (
                    locale === 'tr' ? 'Başla' : 'Get Started'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Credit Packs Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              {locale === 'tr' ? 'Ekstra Kredi Paketleri' : 'Extra Credit Packs'}
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {locale === 'tr'
                ? 'Kredileriniz bittiğinde istediğiniz zaman ek kredi satın alabilirsiniz.'
                : 'Purchase additional credits anytime when you run out.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {CREDIT_PACKAGES.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-xl p-6 transition-all duration-300 ${pack.popular
                  ? 'bg-gradient-to-br from-emerald-600 to-green-700 ring-2 ring-emerald-400'
                  : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                  }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2.5 right-4">
                    <span className="bg-amber-400 text-slate-900 text-xs font-bold px-3 py-0.5 rounded-full">
                      {locale === 'tr' ? 'POPÜLER' : 'POPULAR'}
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${pack.popular ? 'bg-white/20' : 'bg-purple-500/20'
                    }`}>
                    <svg className={`w-6 h-6 ${pack.popular ? 'text-white' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{pack.name}</h3>
                  <p className={`text-3xl font-bold mb-1 ${pack.popular ? 'text-white' : 'text-white'}`}>
                    {pack.credits}
                  </p>
                  <p className={`text-sm ${pack.popular ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {locale === 'tr' ? 'kredi' : 'credits'}
                  </p>

                  <div className="my-4 py-3 border-t border-b border-white/10">
                    <p className={`text-2xl font-bold ${pack.popular ? 'text-white' : 'text-white'}`}>
                      {formatPrice(pack.price)}
                    </p>
                    <p className={`text-xs ${pack.popular ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {formatPrice(pack.pricePerCredit)}/{locale === 'tr' ? 'kredi' : 'credit'}
                    </p>
                  </div>

                  <button
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all ${pack.popular
                      ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                  >
                    {locale === 'tr' ? 'Satın Al' : 'Purchase'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            {locale === 'tr' ? 'Sıkça Sorulan Sorular' : 'Frequently Asked Questions'}
          </h2>

          <div className="space-y-4">
            {[
              {
                q: locale === 'tr' ? 'Kredi nedir?' : 'What is a credit?',
                a: locale === 'tr'
                  ? 'Krediler, AI ile web sitesi oluşturma ve düzenleme işlemlerinde kullanılır. Her işlem türü farklı miktarda kredi tüketir. Örneğin, yeni bir site oluşturmak 10 kredi, küçük bir düzenleme 2 kredi harcar.'
                  : 'Credits are used for AI website generation and editing operations. Each operation type consumes different amounts of credits. For example, creating a new site costs 10 credits, a small edit costs 2 credits.',
              },
              {
                q: locale === 'tr' ? 'Kullanılmayan krediler bir sonraki aya aktarılır mı?' : 'Do unused credits roll over?',
                a: locale === 'tr'
                  ? 'Pro ve üzeri planlarda kullanılmayan krediler bir sonraki aya aktarılabilir (maksimum limite kadar). Ücretsiz planda kredi aktarımı yoktur.'
                  : 'On Pro and higher plans, unused credits can roll over to the next month (up to the maximum limit). Free plan credits do not roll over.',
              },
              {
                q: locale === 'tr' ? 'Planımı istediğim zaman değiştirebilir miyim?' : 'Can I change my plan anytime?',
                a: locale === 'tr'
                  ? 'Evet, planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Yükseltmelerde fark anında tahsil edilir, düşürmelerde ise mevcut dönem sonunda yeni plan başlar.'
                  : 'Yes, you can upgrade or downgrade your plan anytime. Upgrades are charged immediately for the difference, downgrades take effect at the end of the current billing period.',
              },
              {
                q: locale === 'tr' ? 'İptal nasıl yapılır?' : 'How do I cancel?',
                a: locale === 'tr'
                  ? 'Ayarlar > Faturalandırma bölümünden aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal sonrası mevcut dönem sonuna kadar hizmetleriniz devam eder.'
                  : 'You can cancel your subscription anytime from Settings > Billing. After cancellation, your services continue until the end of the current billing period.',
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium hover:bg-slate-700/30 transition-colors">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-400">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
