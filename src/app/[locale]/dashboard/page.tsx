"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      } else {
        router.replace(`/${locale}/login`);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setSession(session);
        } else {
          router.replace(`/${locale}/login`);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router, locale]);

  if (!session) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}! 👋</h2>
          <p className="text-indigo-100 text-lg">
            {locale === 'tr' 
              ? 'AI destekli web sitesi oluşturucuya hoş geldiniz. Hemen yeni bir proje oluşturmaya başlayın.'
              : 'Welcome to the AI-powered website builder. Start creating a new project right away.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Web Sites Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('dashboard.projects.title')}</h2>
              </div>
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-bold px-3 py-1 rounded-full">
                0 {locale === 'tr' ? 'Site' : 'Sites'}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {locale === 'tr' 
                ? 'Henüz bir web sitesi oluşturmadınız. Hemen yeni bir site oluşturmaya başlayın!'
                : "You haven't created a website yet. Start creating a new site right away!"}
            </p>
            <button 
              onClick={() => router.push(`/${locale}`)}
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center font-medium group"
            >
              <svg className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {t('dashboard.projects.newProject')}
            </button>
          </div>

          {/* Analytics Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {locale === 'tr' ? 'Analitikler' : 'Analytics'}
                </h2>
              </div>
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold px-3 py-1 rounded-full">
                {locale === 'tr' ? 'Aktif' : 'Active'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {locale === 'tr' ? 'Toplam Ziyaret' : 'Total Visits'}
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {locale === 'tr' ? 'Sayfa Görüntüleme' : 'Page Views'}
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">0</span>
              </div>
            </div>
          </div>

          {/* AI Credits Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {locale === 'tr' ? 'AI Kredileri' : 'AI Credits'}
                </h2>
              </div>
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-bold px-3 py-1 rounded-full">
                {locale === 'tr' ? 'Ücretsiz' : 'Free'}
              </span>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {locale === 'tr' ? 'Kalan Kredi' : 'Remaining Credits'}
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">100/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium">
              {locale === 'tr' ? 'Kredi Satın Al' : 'Buy Credits'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
