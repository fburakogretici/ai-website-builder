"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const formRef = useRef<HTMLDivElement>(null);

  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        router.replace(`/${locale}/dashboard`);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Session check error:', error);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: any, session: Session | null) => {
        if (session) {
          router.replace(`/${locale}/dashboard`);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router, locale]);

  // Auto-scroll to form when page loads
  useEffect(() => {
    if (!loading && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 150);
    }
  }, [loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError(t('auth.error.connectionFailed'));
      return;
    }

    setAuthError(null);

    // Manual validation for localized errors
    if (!email || !password) {
      setAuthError(t('auth.validation.fillAllFields'));
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setAuthError(t('auth.login.error'));
      } else if (data.session) {
        router.replace(`/${locale}/dashboard`);
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(t('auth.error.connectionFailed'));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError('Connection error. Please refresh the page.');
      return;
    }

    setAuthError(null);

    // Manual validation for localized errors
    if (!email || !password) {
      setAuthError(t('auth.validation.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setAuthError(t('auth.validation.passwordTooShort'));
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setAuthError(t('auth.register.error'));
      } else {
        setAuthError(null);
        toast.success(t('auth.register.success'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError('An error occurred during registration.');
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setAuthError('Connection error. Please refresh the page.');
      return;
    }

    setAuthError(null);
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard`,
        },
      });

      if (error) {
        setIsGoogleLoading(false);
        setAuthError(locale === 'tr'
          ? 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.'
          : 'Failed to sign in with Google. Please try again.'
        );
      }
    } catch (error) {
      console.error('Google login error:', error);
      setIsGoogleLoading(false);
      setAuthError('An error occurred with Google login.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-indigo-600 dark:border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full lg:grid lg:grid-cols-2">

      {/* Left Panel - Professional Visual (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-indigo-950 p-12 relative overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}>
        </div>
        {/* <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900/50 to-purple-950/50"></div> */}

        {/* Brand Logo */}
        <button
          onClick={() => router.push(`/${locale}`)}
          className="relative z-10 inline-block group cursor-pointer mt-6 -ml-6"
        >
          <div className="relative">
            <img
              src="/nocodepage_logo.png"
              alt="NoCodePage"
              className="h-20 w-auto transition-all duration-300 group-hover:scale-105"
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/0 via-purple-500/20 to-pink-500/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"></div>
          </div>
        </button>

        {/* Testimonial / Value Prop */}
        <div className="relative z-10 max-w-lg mb-12">
          <blockquote className="space-y-6">
            <p className="text-3xl font-medium text-white leading-tight">
              "{locale === 'tr'
                ? 'Bu platform iş yapış şeklimizi tamamen değiştirdi. Artık projelerimizi haftalar değil, saatler içinde hayata geçiriyoruz.'
                : 'This platform has completely transformed how we work. We now bring projects to life in hours, not weeks.'}"
            </p>
            <footer className="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Alex Chen"
                className="w-12 h-12 rounded-full border-2 border-indigo-400/30 object-cover"
              />
              <div>
                <div className="text-white font-semibold">Alex Chen</div>
                <div className="text-indigo-200 text-sm">Product Director, TechFlow</div>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-indigo-200/60 text-sm">
          <p>© 2025 {t('common.appName')} Inc.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Clean Form */}
      < div className="flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-white dark:bg-slate-950 min-h-[100dvh] lg:min-h-screen" >
        <div className="w-full max-w-[400px] space-y-8" ref={formRef}>

          {/* Mobile Header Removed as per user request */}

          <div className="text-center lg:text-left space-y- 2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isLogin ? (locale === 'tr' ? 'Tekrar Hoşgeldiniz' : 'Welcome back') : (locale === 'tr' ? 'Hesap Oluşturun' : 'Create an account')}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              {isLogin
                ? (locale === 'tr' ? 'Devam etmek için bilgilerinizi girin' : 'Enter your details to continue')
                : (locale === 'tr' ? 'Başlamak için bilgilerinizi girin' : 'Enter your details to get started')}
            </p>
          </div>

          {/* Tab Switcher with Enhanced Transitions */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            <button
              onClick={() => { setIsLogin(true); setAuthError(null); }}
              className={`py-2.5 text-sm font-medium rounded-md transition-all duration-300 transform ${isLogin
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm scale-100'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-105'
                }`}
            >
              {t('auth.login.title')}
            </button>
            <button
              onClick={() => { setIsLogin(false); setAuthError(null); }}
              className={`py-2.5 text-sm font-medium rounded-md transition-all duration-300 transform ${!isLogin
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm scale-100'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:scale-105'
                }`}
            >
              {t('auth.register.title')}
            </button>
          </div>

          {/* Error Alert  */}

          {authError && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {authError}
            </div>

          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-900 dark:text-slate-200">
                {isLogin ? t('auth.login.email') : t('auth.register.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-transparent text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 focus:shadow-lg focus:shadow-indigo-600/10 dark:focus:shadow-indigo-500/20"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  {isLogin ? t('auth.login.password') : t('auth.register.password')}
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/forgot-password`)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    {locale === 'tr' ? 'Şifremi unuttum' : 'Forgot password'}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-transparent text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent transition-all duration-300 pr-10 hover:border-slate-300 dark:hover:border-slate-700 focus:shadow-lg focus:shadow-indigo-600/10 dark:focus:shadow-indigo-500/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 transition-all duration-200 hover:scale-110"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:shadow-lg hover:shadow-indigo-600/30 dark:hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLogin ? t('auth.login.loginButton') : t('auth.register.registerButton')}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">
                {locale === 'tr' ? 'veya' : 'or continue with'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] hover:border-slate-300 dark:hover:border-slate-700"
          >
            {isGoogleLoading ? (
              <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Google</span>
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {locale === 'tr'
              ? 'Devam ederek Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.'
              : 'By clicking continue, you agree to our Terms of Service and Privacy Policy.'}
          </p>
        </div>
      </div >
    </div >
  );
}
