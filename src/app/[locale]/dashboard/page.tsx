"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import type { Session } from '@supabase/supabase-js';
import WebsiteCard from '@/components/dashboard/WebsiteCard';

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(true);
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const supabase = useSupabaseClient();

  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession: Session | null) => {
      if (newSession) {
        // If user ID hasn't changed, do a silent update
        const isSameUser = sessionRef.current?.user?.id === newSession.user.id;
        setSession(newSession);
        // Only load websites if user changed or if it's the first load (no previous session)
        loadWebsites(newSession.user.id, !isSameUser);
      } else {
        router.replace(`/${locale}/login`);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router, locale]); // Removed session dependency

  const loadWebsites = async (userId: string, showLoading = true) => {
    if (showLoading) {
      setIsLoadingWebsites(true);
    }
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
      if (showLoading) {
        setIsLoadingWebsites(false);
      }
    }
  };

  const handleDeleteWebsite = async (websiteId: string, websiteName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      locale === 'tr'
        ? `"${websiteName}" adlı siteyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
        : `Are you sure you want to delete "${websiteName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase!
        .from('websites')
        .delete()
        .eq('id', websiteId);

      if (error) throw error;

      // Refresh the websites list
      if (session) {
        loadWebsites(session.user.id);
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      alert(locale === 'tr' ? 'Site silinirken bir hata oluştu.' : 'Error deleting website.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section - Minimal */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.welcome')}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {locale === 'tr'
              ? 'AI ile web sitenizi oluşturun veya mevcut sitelerinizi yönetin.'
              : 'Create your website with AI or manage your existing sites.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Quick Actions - AI Builder */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h2 className="text-2xl font-bold">
                    {locale === 'tr' ? 'AI ile Web Sitesi Oluştur' : 'Create Website with AI'}
                  </h2>
                </div>
                <p className="text-indigo-100 text-base leading-relaxed">
                  {locale === 'tr'
                    ? 'Sadece istediklerinizi anlatın, AI sizin için profesyonel web sitesini oluştursun.'
                    : 'Just describe what you want, AI will create a professional website for you.'}
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/ai-builder`)}
                className="bg-white text-indigo-600 py-3 px-8 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center font-bold text-lg whitespace-nowrap"
              >
                {locale === 'tr' ? 'Başlayın' : 'Get Started'}
                <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Web Sites Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {locale === 'tr' ? 'Web Sitelerim' : 'My Websites'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {websites.length} {locale === 'tr' ? 'site' : websites.length === 1 ? 'site' : 'sites'}
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/ai-builder`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium"
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
                <div className="relative inline-block">
                  <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {locale === 'tr' ? 'Henüz site oluşturmadınız' : "No websites yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {locale === 'tr'
                    ? 'Yukarıdaki butona tıklayarak ilk web sitenizi oluşturun.'
                    : 'Click the button above to create your first website.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {websites.map((website) => (
                  <WebsiteCard
                    key={website.id}
                    website={website}
                    onDelete={handleDeleteWebsite}
                    onUpdate={() => session && loadWebsites(session.user.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
