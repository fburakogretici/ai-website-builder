"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function Home() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const supabase = useSupabaseClient();

  useEffect(() => {
    // Check session in background, don't block UI
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleWebsiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.replace(`/${locale}/login`);
      return;
    }

    console.log("Web Sitesi Oluşturma Formu Submitted:", { businessName, industry, userId: session.user.id });
    router.replace(`/${locale}/dashboard`);
  };

  // Removed loading screen - show content immediately

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section - Compact & Visual */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-orange-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Floating Code Symbols */}
          <div className="absolute top-20 left-10 text-indigo-400/20 dark:text-indigo-400/10 text-6xl font-mono animate-float">{'<>'}</div>
          <div className="absolute top-40 right-20 text-purple-400/20 dark:text-purple-400/10 text-5xl font-mono animate-float" style={{ animationDelay: '0.5s' }}>{'{ }'}</div>
          <div className="absolute bottom-32 left-1/4 text-pink-400/20 dark:text-pink-400/10 text-7xl font-mono animate-float" style={{ animationDelay: '1s' }}>{'</>'}</div>
          <div className="absolute top-1/3 right-10 text-cyan-400/20 dark:text-cyan-400/10 text-4xl font-mono animate-float" style={{ animationDelay: '1.5s' }}>{'[ ]'}</div>
          
          {/* AI Sparkles */}
          <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.7s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1.2s' }}></div>
          
          {/* Browser Window Mockups */}
          <div className="absolute top-10 right-10 w-32 h-24 bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-indigo-300/20 dark:border-indigo-500/10 rounded-lg animate-float-slow">
            <div className="flex gap-1 p-2">
              <div className="w-2 h-2 rounded-full bg-red-400/40"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400/40"></div>
              <div className="w-2 h-2 rounded-full bg-green-400/40"></div>
            </div>
            <div className="px-2 space-y-1">
              <div className="h-1 bg-indigo-400/20 rounded w-3/4"></div>
              <div className="h-1 bg-purple-400/20 rounded w-1/2"></div>
              <div className="h-1 bg-pink-400/20 rounded w-2/3"></div>
            </div>
          </div>
          
          <div className="absolute bottom-20 left-10 w-36 h-28 bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-purple-300/20 dark:border-purple-500/10 rounded-lg animate-float-slow" style={{ animationDelay: '0.8s' }}>
            <div className="flex gap-1 p-2">
              <div className="w-2 h-2 rounded-full bg-red-400/40"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400/40"></div>
              <div className="w-2 h-2 rounded-full bg-green-400/40"></div>
            </div>
            <div className="px-2 space-y-1">
              <div className="h-1 bg-purple-400/20 rounded w-full"></div>
              <div className="h-1 bg-indigo-400/20 rounded w-3/4"></div>
              <div className="h-1 bg-cyan-400/20 rounded w-5/6"></div>
            </div>
          </div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4OCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-5"></div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto relative z-10 text-center py-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-indigo-200 dark:border-indigo-800 shadow-lg mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {locale === 'tr' ? '🎉 AI Destekli Web Sitesi Oluşturucu' : '🎉 AI-Powered Website Builder'}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              {t('homepage.hero.title')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {t('homepage.hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <button
              onClick={() => session ? router.push(`/${locale}/dashboard`) : router.push(`/${locale}/login`)}
              className="group relative px-7 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-base rounded-xl shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                {locale === 'tr' ? 'Ücretsiz Başla' : 'Start Free'}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => {
                document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-7 py-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {locale === 'tr' ? 'Nasıl Çalışır?' : 'How It Works?'}
              </span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{locale === 'tr' ? 'Kod Gerektirmez' : 'No Code Required'}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{locale === 'tr' ? '5 Dakikada Hazır' : 'Ready in 5 Minutes'}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{locale === 'tr' ? 'AI Destekli' : 'AI-Powered'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section id="how" className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto w-full">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100/80 dark:bg-indigo-900/30 backdrop-blur-sm rounded-full mb-4">
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {locale === 'tr' ? '⚡ NASIL ÇALIŞIR' : '⚡ HOW IT WORKS'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {locale === 'tr' ? 'Sadece 3 basit adımda' : 'Just 3 simple steps'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {locale === 'tr' 
                ? 'AI destekli web sitesi oluşturucumuz, işletmeniz için özel olarak tasarlanmış, profesyonel görünümlü bir web sitesi oluşturacaktır.'
                : 'Our AI-powered website builder will create a professional-looking website specifically designed for your business.'}
            </p>
          </div>

          {/* 3 Step Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl mb-6 shadow-lg shadow-orange-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg font-bold text-sm mb-3">1</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {locale === 'tr' ? 'Soruları Cevaplayın' : 'Answer Questions'}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {locale === 'tr'
                    ? 'İşletmeniz hakkında birkaç basit soruyu yanıtlayın. AI teknolojimiz bilgilerinize göre en uygun tasarımı oluşturacak.'
                    : 'Answer a few simple questions about your business. Our AI will create the most suitable design based on your information.'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl mb-6 shadow-lg shadow-purple-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg font-bold text-sm mb-3">2</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {locale === 'tr' ? 'AI Oluşturur' : 'AI Creates'}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {locale === 'tr'
                    ? 'Yapay zeka destekli sistemimiz, saniyeler içinde işletmenize özel profesyonel bir web sitesi oluşturur.'
                    : 'Our AI-powered system creates a professional website for your business in seconds.'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-300 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl mb-6 shadow-lg shadow-teal-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg font-bold text-sm mb-3">3</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {locale === 'tr' ? 'Özelleştirin & Yayınlayın' : 'Customize & Publish'}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {locale === 'tr'
                    ? 'Web sitenizin çeşitli projelerini inceleyin ve istediğiniz değişiklikleri yaparak özelleştirin.'
                    : 'Review various projects of your website and customize by making the changes you want.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Old content below - keeping for reference */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8" style={{display: 'none'}}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6 animate-pulse">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {t('homepage.features.ai.title')}
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
              {t('homepage.hero.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
              {t('homepage.hero.subtitle')}
            </p>
          </div>

          {/* Form Card */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700">
              <form onSubmit={handleWebsiteSubmit} className="space-y-6">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t('homepage.form.projectName')}
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    placeholder={t('homepage.form.projectNamePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    {t('homepage.form.category')}
                  </label>
                  <input
                    type="text"
                    id="industry"
                    placeholder={t('homepage.form.categoryPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center group"
                >
                  <span>{t('homepage.form.createButton')}</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto w-full">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100/80 dark:bg-purple-900/30 backdrop-blur-sm rounded-full mb-4">
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {locale === 'tr' ? '✨ ÖZELLİKLER' : '✨ FEATURES'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {locale === 'tr' ? 'Güçlü özellikler, basit kullanım' : 'Powerful features, simple usage'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {locale === 'tr'
                ? 'Modern web teknolojileri ile donatılmış, kullanıcı dostu arayüz'
                : 'User-friendly interface equipped with modern web technologies'}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - AI Powered */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 h-full">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('homepage.features.ai.title')}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('homepage.features.ai.description')}
                </p>
              </div>
            </div>

            {/* Feature 2 - Fast */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 h-full">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mb-6 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('homepage.features.fast.title')}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('homepage.features.fast.description')}
                </p>
              </div>
            </div>

            {/* Feature 3 - Customizable */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-300 dark:hover:border-pink-700 transition-all duration-300 h-full">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl mb-6 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {locale === 'tr' ? 'Özelleştirilebilir' : 'Customizable'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {locale === 'tr'
                    ? 'Web sitenizi tamamen kendi tarzınıza göre özelleştirin.'
                    : 'Customize your website completely to your own style.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section - Static Website Themes Only */}
      <section id="templates" className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {locale === 'tr' ? 'Profesyonel Temalar' : 'Professional Themes'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              {locale === 'tr' ? 'Statik web siteniz için modern ve şık tasarımlar' : 'Modern and elegant designs for your static website'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Portfolio Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center">
                <svg className="w-20 h-20 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === 'tr' ? 'Portfolyo' : 'Portfolio'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {locale === 'tr' ? 'Kreatif profesyoneller için görsel odaklı tasarım' : 'Visual-focused design for creative professionals'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                    {locale === 'tr' ? 'Galeri' : 'Gallery'}
                  </span>
                  <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                    {locale === 'tr' ? 'Minimalist' : 'Minimal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Landing Page Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="h-48 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center">
                <svg className="w-20 h-20 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === 'tr' ? 'Açılış Sayfası' : 'Landing Page'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {locale === 'tr' ? 'Ürün ve hizmet tanıtımı için yüksek dönüşüm' : 'High conversion for product and service showcase'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    {locale === 'tr' ? 'Modern' : 'Modern'}
                  </span>
                  <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-full text-sm">
                    CTA
                  </span>
                </div>
              </div>
            </div>

            {/* Business Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="h-48 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center">
                <svg className="w-20 h-20 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === 'tr' ? 'İş & Kurumsal' : 'Business & Corporate'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {locale === 'tr' ? 'Şirketler ve kurumlar için güvenilir tasarım' : 'Reliable design for companies and corporations'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                    {locale === 'tr' ? 'Klasik' : 'Classic'}
                  </span>
                  <span className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full text-sm">
                    {locale === 'tr' ? 'Profesyonel' : 'Professional'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {locale === 'tr' ? 'Basit ve Şeffaf Fiyatlandırma' : 'Simple and Transparent Pricing'}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              {locale === 'tr' ? 'İhtiyacınıza uygun planı seçin' : 'Choose the plan that fits your needs'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {locale === 'tr' ? 'Başlangıç' : 'Starter'}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {locale === 'tr' ? '/ ay' : '/ month'}
                </span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {locale === 'tr' ? '1 Web Sitesi' : '1 Website'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {locale === 'tr' ? 'Temel Temalar' : 'Basic Themes'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {locale === 'tr' ? 'Topluluk Desteği' : 'Community Support'}
                  </span>
                </li>
              </ul>
              <button className="w-full py-3 px-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                {locale === 'tr' ? 'Başla' : 'Get Started'}
              </button>
            </div>

            {/* Pro Plan - Popular */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 transform scale-105 shadow-2xl relative">
              <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 rounded-bl-lg rounded-tr-lg font-bold text-sm">
                {locale === 'tr' ? 'Popüler' : 'Popular'}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {locale === 'tr' ? 'Profesyonel' : 'Professional'}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$29</span>
                <span className="text-indigo-100 ml-2">
                  {locale === 'tr' ? '/ ay' : '/ month'}
                </span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">
                    {locale === 'tr' ? '10 Web Sitesi' : '10 Websites'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">
                    {locale === 'tr' ? 'Tüm Premium Temalar' : 'All Premium Themes'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">
                    {locale === 'tr' ? 'Özel Domain' : 'Custom Domain'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-white mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white">
                    {locale === 'tr' ? 'Öncelikli Destek' : 'Priority Support'}
                  </span>
                </li>
              </ul>
              <button className="w-full py-3 px-6 rounded-lg bg-white text-indigo-600 font-bold hover:bg-gray-100 transition-colors duration-200">
                {locale === 'tr' ? 'Hemen Başla' : 'Start Now'}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {locale === 'tr' ? 'Kurumsal' : 'Enterprise'}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$99</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {locale === 'tr' ? '/ ay' : '/ month'}
                </span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {locale === 'tr' ? 'Sınırsız Web Sitesi' : 'Unlimited Websites'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {locale === 'tr' ? 'Özel Tema Geliştirme' : 'Custom Theme Development'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {locale === 'tr' ? 'API Erişimi' : 'API Access'}
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {locale === 'tr' ? '7/24 Premium Destek' : '24/7 Premium Support'}
                  </span>
                </li>
              </ul>
              <button className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-xl transition-all duration-200">
                {locale === 'tr' ? 'İletişime Geç' : 'Contact Sales'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {locale === 'tr' ? 'Web sitenizi bugün oluşturun' : 'Create your website today'}
          </h2>
          <p className="text-base text-indigo-100 mb-6">
            {locale === 'tr' 
              ? 'AI destekli platformumuzla profesyonel web sitenizi dakikalar içinde hazır hale getirin'
              : 'Get your professional website ready in minutes with our AI-powered platform'
            }
          </p>
          <button 
            onClick={() => router.push(session ? '/dashboard' : '/login')}
            className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-indigo-600 font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-2xl"
          >
            {locale === 'tr' ? 'Ücretsiz Başla' : 'Start Free'}
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50 animate-bounce hover:animate-none"
          aria-label={locale === 'tr' ? 'Yukarı çık' : 'Scroll to top'}
        >
          <svg 
            className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
