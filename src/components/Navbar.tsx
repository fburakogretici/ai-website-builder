"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Avatar from '@/components/Avatar';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { Session } from '@supabase/supabase-js';

interface NavbarProps {
  session?: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const supabase = useSupabaseClient();
  const { profile } = useUserProfile({ supabase, session });

  const { theme, setTheme } = useTheme();
  const [menuView, setMenuView] = useState<'main' | 'appearance'>('main');

  // Reset menu view when closing
  useEffect(() => {
    if (!showAccountMenu) {
      setTimeout(() => setMenuView('main'), 200);
    }
  }, [showAccountMenu]);

  // Check if we're on login or register page
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');

  const displayName = profile.displayName || session?.user?.email?.split('@')[0] || '';
  const email = profile.email || session?.user?.email || '';
  const avatarUrl = profile.avatarUrl;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <nav className="relative w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <div className="flex justify-between items-center h-16 overflow-visible">
          {/* Logo */}
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex items-center cursor-pointer group relative"
          >
            <img
              src="/nocodepage_logo.png"
              alt="NoCodePage"
              className="h-14 w-auto transition-all duration-300 group-hover:scale-105 invert dark:invert-0"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
          </button>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href={`/${locale}#features`}
              className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
            >
              <span className="relative z-10">{locale === 'tr' ? 'Özellikler' : 'Features'}</span>
              <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
            <a
              href={`/${locale}#how`}
              className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
            >
              <span className="relative z-10">{locale === 'tr' ? 'Nasıl Çalışır' : 'How It Works'}</span>
              <div className="absolute inset-0 bg-purple-50 dark:bg-purple-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
            <a
              href={`/${locale}#templates`}
              className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors group"
            >
              <span className="relative z-10">{locale === 'tr' ? 'Şablonlar' : 'Templates'}</span>
              <div className="absolute inset-0 bg-pink-50 dark:bg-pink-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
            <a
              href={`/${locale}#pricing`}
              className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
            >
              <span className="relative z-10">{locale === 'tr' ? 'Fiyatlandırma' : 'Pricing'}</span>
              <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </a>
          </div>

          {/* Right Side - Language Switcher & Login/Account */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {session ? (
              <>
                <button
                  ref={buttonRef}
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold overflow-hidden shadow-md ring-2 ring-white/50 dark:ring-gray-900/50">
                    <Avatar
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full rounded-lg"
                      imageClassName="object-cover"
                    />
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 max-w-[80px] truncate">
                      {displayName}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${showAccountMenu ? "rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {mounted && showAccountMenu && createPortal(
                  <div
                    ref={dropdownRef}
                    className="fixed w-64 bg-white/98 dark:bg-gray-800/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-indigo-200/40 dark:border-indigo-800/40 overflow-hidden z-[10000] animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                      top: `${(buttonRef.current?.getBoundingClientRect().bottom || 0) + 12}px`,
                      right: `${window.innerWidth - (buttonRef.current?.getBoundingClientRect().right || 0)}px`,
                    }}
                  >
                    {menuView === 'main' ? (
                      <>
                        {/* User Info Header */}
                        <div className="px-4 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-b border-indigo-200/40 dark:border-indigo-800/40">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/80 dark:ring-gray-900/80">
                              <Avatar
                                src={avatarUrl}
                                alt="Avatar"
                                className="h-full w-full rounded-xl"
                                imageClassName="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {displayName}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              router.push(`/${locale}/dashboard`);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all duration-150 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors group-hover:scale-110 duration-200">
                              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                            <span>Dashboard</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              router.push(`/${locale}/settings/profile`);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-all duration-150 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100/70 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors group-hover:scale-110 duration-200">
                              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span>{t('settings.menu.profile')}</span>
                          </button>

                          <button
                            onClick={() => setMenuView('appearance')}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-150 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors group-hover:scale-110 duration-200">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                              </div>
                              <span>{locale === 'tr' ? 'Görünüm' : 'Appearance'}</span>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Logout Section */}
                        <div className="border-t border-indigo-200/40 dark:border-indigo-800/40 p-2">
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-150 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-100/70 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors group-hover:scale-110 duration-200">
                              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <span>{t('dashboard.accountMenu.logout')}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Appearance Menu Header */}
                        <div className="px-2 py-2 border-b border-indigo-200/40 dark:border-indigo-800/40 flex items-center gap-2">
                          <button
                            onClick={() => setMenuView('main')}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {locale === 'tr' ? 'Görünüm' : 'Appearance'}
                          </span>
                        </div>

                        {/* Theme Options */}
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => setTheme('light')}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${theme === 'light'
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span>{locale === 'tr' ? 'Açık' : 'Light'}</span>
                            </div>
                            {theme === 'light' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => setTheme('dark')}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${theme === 'dark'
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                              </svg>
                              <span>{locale === 'tr' ? 'Koyu' : 'Dark'}</span>
                            </div>
                            {theme === 'dark' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => setTheme('system')}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${theme === 'system'
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{locale === 'tr' ? 'Sistem' : 'System'}</span>
                            </div>
                            {theme === 'system' && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>,
                  document.body
                )}
              </>
            ) : !isAuthPage && (
              <button
                onClick={() => router.push(`/${locale}/login`)}
                className="relative px-5 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 group overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {locale === 'tr' ? 'Giriş Yap' : 'Login'}
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
