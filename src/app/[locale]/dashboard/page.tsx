"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import type { Session } from '@supabase/supabase-js';
import WebsiteCard from '@/components/dashboard/WebsiteCard';
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [isLoadingWebsites, setIsLoadingWebsites] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { confirm } = useConfirm();

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
    //
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

    const confirmed = await confirm({
      title: locale === 'tr' ? 'Siteyi Sil' : 'Delete Website',
      message: locale === 'tr'
        ? `"${websiteName}" adlı siteyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
        : `Are you sure you want to delete "${websiteName}"? This action cannot be undone.`,
      confirmText: locale === 'tr' ? 'Sil' : 'Delete',
      cancelText: locale === 'tr' ? 'İptal' : 'Cancel',
      variant: 'danger'
    });

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
      toast.success(locale === 'tr' ? 'Site silindi' : 'Website deleted');
    } catch (error) {
      console.error('Error deleting website:', error);
      toast.error(locale === 'tr' ? 'Site silinirken bir hata oluştu.' : 'Error deleting website.');
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



  const filteredWebsites = websites.filter(site => {
    if (filter === 'all') return true;
    if (filter === 'published') return site.is_published;
    if (filter === 'draft') return !site.is_published;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('dashboard.welcome')}! <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 font-medium">
              {locale === 'tr'
                ? 'Web sitelerinizi yönetin veya yenisini oluşturun.'
                : 'Manage your websites or create a new one.'}
            </p>
          </div>

          <button
            onClick={() => router.push(`/${locale}/ai-builder`)}
            className="group inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-full text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className="mr-2 text-xl group-hover:rotate-90 transition-transform duration-300">＋</span>
            {locale === 'tr' ? 'Yeni Site Oluştur' : 'Create New Site'}
          </button>
        </div>

        {/* Websites Grid */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
              {locale === 'tr' ? 'Web Sitelerim' : 'My Websites'}
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {websites.length}
              </span>
            </h2>

            {/* Filter Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                {locale === 'tr' ? 'Tümü' : 'All'}
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'published'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                {locale === 'tr' ? 'Yayında' : 'Published'}
                <span className="ml-2 text-xs opacity-70 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                  {websites.filter(w => w.is_published).length}
                </span>
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'draft'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                {locale === 'tr' ? 'Taslak' : 'Draft'}
                <span className="ml-2 text-xs opacity-70 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">
                  {websites.filter(w => !w.is_published).length}
                </span>
              </button>
            </div>
          </div>

          {isLoadingWebsites ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : websites.length === 0 ? (
            /* Empty State Hero */
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {locale === 'tr' ? 'Henüz bir web siteniz yok' : "You don't have any websites yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-lg">
                {locale === 'tr'
                  ? 'Yapay zeka asistanımızla dakikalar içinde profesyonel bir web sitesi oluşturmaya başlayın.'
                  : 'Start creating a professional website in minutes with our AI assistant.'}
              </p>
              <button
                onClick={() => router.push(`/${locale}/ai-builder`)}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                {locale === 'tr' ? 'Şimdi Başla' : 'Start Now'}
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWebsites.map((website) => (
                <WebsiteCard
                  key={website.id}
                  website={website}
                  onDelete={handleDeleteWebsite}
                  onUpdate={() => session && loadWebsites(session.user.id)}
                />
              ))}

              {/* Add New Card (Ghost) - Only show when filter is 'all' or 'draft' */}
              {(filter === 'all' || filter === 'draft') && (
                <button
                  onClick={() => router.push(`/${locale}/ai-builder`)}
                  className="group h-full min-h-[300px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-6 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-200"
                >
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-lg font-medium text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400">
                    {locale === 'tr' ? 'Yeni Site Oluştur' : 'Create New Site'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
