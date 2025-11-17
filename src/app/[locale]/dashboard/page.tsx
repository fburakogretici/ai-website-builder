"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(true);
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        loadWebsites(data.session.user.id);
      } else {
        router.replace(`/${locale}/login`);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession) {
        setSession(newSession);
        loadWebsites(newSession.user.id);
      } else {
        router.replace(`/${locale}/login`);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router, locale]);

  const loadWebsites = async (userId: string) => {
    setIsLoadingWebsites(true);
    try {
      const { data, error } = await supabase!
        .from('websites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setWebsites(data || []);
      console.log('✅ Loaded websites from Supabase:', data?.length || 0);
    } catch (error) {
      console.error('Error loading websites:', error);
    } finally {
      setIsLoadingWebsites(false);
    }
  };

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
          {/* AI Builder Card - NEW */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-xl shadow-2xl p-6 hover:shadow-2xl transition-all duration-200 border-2 border-purple-400 group col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {locale === 'tr' ? 'AI Web Sitesi Oluşturucu' : 'AI Website Builder'}
                    </h2>
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      ✨ {locale === 'tr' ? 'YENİ' : 'NEW'}
                    </span>
                  </div>
                </div>
                <p className="text-purple-100 text-base mb-4 max-w-2xl">
                  {locale === 'tr' 
                    ? '🚀 Sadece bir prompt ile dakikalar içinde profesyonel web sitenizi oluşturun! AI sizin için en uygun template\'i seçer ve içeriği yazar.'
                    : '🚀 Create your professional website in minutes with just one prompt! AI selects the best template and writes content for you.'}
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">⚡ Hızlı</span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">🎨 Otomatik Tasarım</span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">✍️ AI İçerik</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => router.push(`/${locale}/ai-builder`)}
                  className="bg-white text-purple-600 py-4 px-8 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center font-bold text-lg group whitespace-nowrap"
                >
                  <span className="text-2xl mr-2">✨</span>
                  {locale === 'tr' ? 'Hemen Dene' : 'Try Now'}
                  <svg className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="text-purple-200 text-xs text-center">
                  {locale === 'tr' ? 'Klasik yöntem için aşağıya bakın' : 'For classic method see below'}
                </p>
              </div>
            </div>
          </div>

          {/* Web Sites Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 group col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{locale === 'tr' ? 'Sitelerim' : 'My Websites'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{websites.length} {locale === 'tr' ? 'site' : 'sites'}</p>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/${locale}/ai-builder`)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                {locale === 'tr' ? 'Yeni Site' : 'New Site'}
              </button>
            </div>

            {/* Websites List */}
            {isLoadingWebsites ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {locale === 'tr' ? 'Henüz site oluşturmadınız' : "You haven't created any sites yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {locale === 'tr' 
                    ? 'AI ile birkaç dakikada profesyonel sitenizi oluşturun!' 
                    : 'Create your professional site in minutes with AI!'}
                </p>
                <button 
                  onClick={() => router.push(`/${locale}/ai-builder`)}
                  className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium inline-flex items-center gap-2"
                >
                  <span className="text-xl">✨</span>
                  {locale === 'tr' ? 'İlk Siteyi Oluştur' : 'Create First Site'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {websites.map((website) => (
                  <div 
                    key={website.id} 
                    className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 group cursor-pointer"
                    onClick={() => router.push(`/${locale}/editor/${website.id}`)}
                  >
                    {/* Preview thumbnail */}
                    <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      <iframe
                        srcDoc={website.html_content}
                        className="w-full h-64 border-0 pointer-events-none scale-[0.25] origin-top-left"
                        style={{ transform: 'scale(0.5)', width: '200%', height: '256px' }}
                        title={`Preview of ${website.name}`}
                        sandbox=""
                      />
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {website.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          website.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {website.status === 'active' ? (locale === 'tr' ? '🟢 Yayında' : '🟢 Live') : (locale === 'tr' ? '📝 Taslak' : '📝 Draft')}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(website.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${locale}/editor/${website.id}`);
                          }}
                          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          ✏️ {locale === 'tr' ? 'Düzenle' : 'Edit'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const win = window.open('', '_blank');
                            if (win) {
                              win.document.open();
                              win.document.write(website.html_content);
                              win.document.close();
                            }
                          }}
                          className="py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          👁️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
