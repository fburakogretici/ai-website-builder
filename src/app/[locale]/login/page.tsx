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
          redirectTo: `${window.location.origin}/${locale}/auth/callback`,
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
    // Keep loading state true since we're redirecting to Google
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex flex-col">
      {/* Main Content */}
      <div ref={formRef} className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {t('common.appName')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? t('auth.login.subtitle') : t('auth.register.subtitle')}
              </p>
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center gap-2 mb-4 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setAuthError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${isLogin
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {t('auth.login.title')}
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setAuthError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${!isLogin
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {t('auth.register.title')}
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{authError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-3" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  {isLogin ? t('auth.login.email') : t('auth.register.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder={isLogin ? t('auth.login.emailPlaceholder') : t('auth.register.emailPlaceholder')}
                  title={t('auth.validation.emailRequired')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setAuthError(null);
                  }}
                  onInvalid={(e) => {
                    e.preventDefault();
                    setAuthError(t('auth.validation.emailRequired'));
                  }}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  {isLogin ? t('auth.login.password') : t('auth.register.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder={isLogin ? t('auth.login.passwordPlaceholder') : t('auth.register.passwordPlaceholder')}
                    title={t('auth.validation.passwordRequired')}
                    minLength={6}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAuthError(null);
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      setAuthError(t('auth.validation.passwordRequired'));
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {isLogin && (
                  <div className="mt-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/forgot-password`)}
                      className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                    >
                      {locale === 'tr' ? 'Şifremi Unuttum?' : 'Forgot Password?'}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm sm:text-base hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center group"
              >
                <span>{isLogin ? t('auth.login.loginButton') : t('auth.register.registerButton')}</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>

            {/* Divider */}
            <div className="mt-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                    {locale === 'tr' ? 'veya' : 'or'}
                  </span>
                </div>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center group shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isGoogleLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{locale === 'tr' ? 'Yönlendiriliyor...' : 'Redirecting...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{locale === 'tr' ? 'Google ile Devam Et' : 'Continue with Google'}</span>
                </>
              )}
            </button>
          </div>

          {/* Features - More Compact */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">100+</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{locale === 'tr' ? 'AI Şablonlar' : 'AI Templates'}</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">5 {locale === 'tr' ? 'Dk' : 'Min'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{locale === 'tr' ? 'Hızlı Kurulum' : 'Quick Setup'}</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-pink-600 dark:text-pink-400">24/7</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{locale === 'tr' ? 'Destek' : 'Support'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
