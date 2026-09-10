"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { UserCredits, CREDIT_COSTS } from "@/types/subscription";

interface CreditWidgetProps {
  variant?: 'compact' | 'full';
}

export default function CreditWidget({ variant = 'compact' }: CreditWidgetProps) {
  const locale = useLocale();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }
      const data = await response.json();
      setCredits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${variant === 'compact' ? 'h-10' : 'h-32'} bg-slate-700/50 rounded-xl`} />
    );
  }

  if (error || !credits) {
    return null;
  }

  // API'den gelen credits objesi
  const creditData = (credits as { credits?: UserCredits }).credits || credits;
  const totalCredits = creditData.total || 0;
  const maxWebsites = Math.floor(totalCredits / CREDIT_COSTS.WEBSITE_CREATE);
  const isLow = totalCredits < 20;

  if (variant === 'compact') {
    return (
      <Link 
        href={`/${locale}/settings/billing`}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isLow 
            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
            : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-sm font-semibold">{totalCredits}</span>
        <span className="text-xs opacity-70">{locale === 'tr' ? 'kredi' : 'credits'}</span>
      </Link>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400">
            {locale === 'tr' ? 'Kredi Bakiyeniz' : 'Your Credit Balance'}
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-white">{totalCredits}</span>
            <span className="text-slate-400">{locale === 'tr' ? 'kredi' : 'credits'}</span>
          </div>
        </div>
        <div className={`p-2.5 rounded-xl ${isLow ? 'bg-amber-500/20' : 'bg-violet-500/20'}`}>
          <svg className={`w-5 h-5 ${isLow ? 'text-amber-400' : 'text-violet-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Credit Breakdown */}
      <div className="space-y-2 mb-4">
        {creditData.dailyRemaining > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{locale === 'tr' ? 'Günlük' : 'Daily'}</span>
            <span className="text-slate-300">{creditData.dailyRemaining}</span>
          </div>
        )}
        {creditData.monthly > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{locale === 'tr' ? 'Aylık' : 'Monthly'}</span>
            <span className="text-slate-300">{creditData.monthly - (creditData.usedThisMonth || 0)}</span>
          </div>
        )}
        {creditData.bonus > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{locale === 'tr' ? 'Bonus' : 'Bonus'}</span>
            <span className="text-emerald-400">{creditData.bonus}</span>
          </div>
        )}
        {creditData.purchased > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{locale === 'tr' ? 'Satın alınan' : 'Purchased'}</span>
            <span className="text-purple-400">{creditData.purchased}</span>
          </div>
        )}
      </div>

      {/* Usage Estimate */}
      <div className="py-3 border-t border-slate-700/50 mb-4">
        <p className="text-xs text-slate-400">
          {locale === 'tr' 
            ? `≈ ${maxWebsites} yeni web sitesi oluşturabilirsiniz`
            : `≈ ${maxWebsites} new websites you can create`
          }
        </p>
      </div>

      {/* Low Credit Warning */}
      {isLow && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-amber-400">
              {locale === 'tr' 
                ? 'Krediniz azaldı. Kesintisiz kullanım için kredi satın alın.'
                : 'Running low on credits. Purchase more for uninterrupted usage.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/${locale}/pricing`}
          className="flex-1 py-2 px-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-lg text-center hover:from-violet-400 hover:to-purple-500 transition-all"
        >
          {locale === 'tr' ? 'Kredi Al' : 'Get Credits'}
        </Link>
        <Link
          href={`/${locale}/settings/billing`}
          className="py-2 px-3 bg-slate-700/50 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          {locale === 'tr' ? 'Detaylar' : 'Details'}
        </Link>
      </div>
    </div>
  );
}
