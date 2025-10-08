"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from "@/utils/supabase/client";
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface NavbarProps {
  session?: any;
}

export default function Navbar({ session }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({ full_name: '', avatar_url: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();

  // Check if we're on login or register page
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');

  useEffect(() => {
    if (session) {
      // Get user profile from user_metadata (where avatar is stored as base64)
      setUserProfile({
        full_name: session.user.user_metadata?.full_name || '',
        avatar_url: session.user.user_metadata?.avatar_url || ''
      });
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex items-center cursor-pointer group"
          >
            <img 
              src="/nocodepage_logo.png" 
              alt="NoCodePage" 
              className="h-14 w-auto transition-all duration-300 group-hover:scale-105"
            />
          </button>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href={`/${locale}#features`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {locale === 'tr' ? 'Özellikler' : 'Features'}
            </a>
            <a href={`/${locale}#how`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {locale === 'tr' ? 'Nasıl Çalışır' : 'How It Works'}
            </a>
            <a href={`/${locale}#templates`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {locale === 'tr' ? 'Şablonlar' : 'Templates'}
            </a>
            <a href={`/${locale}#pricing`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {locale === 'tr' ? 'Fiyatlandırma' : 'Pricing'}
            </a>
          </div>

          {/* Right Side - Language Switcher & Login/Account */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/40 dark:border-indigo-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold overflow-hidden shadow-sm">
                    {userProfile.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      userProfile.full_name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {userProfile.full_name || session.user.email?.split('@')[0]}
                    </span>
                  </div>
                  <svg
                    className={`w-3 h-3 text-indigo-600 dark:text-indigo-400 transition-transform duration-200 ${
                      showAccountMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-indigo-200/30 dark:border-indigo-800/30 overflow-hidden z-50">
                    {/* User Info Header */}
                    <div className="px-3 py-2.5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b border-indigo-200/30 dark:border-indigo-800/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                          {userProfile.avatar_url ? (
                            <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            userProfile.full_name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || "?"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {userProfile.full_name || session.user.email?.split('@')[0]}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{session.user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push(`/${locale}/dashboard`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-150 group"
                      >
                        <div className="w-6 h-6 rounded-md bg-indigo-100/50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push(`/${locale}/settings/profile`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-150 group"
                      >
                        <div className="w-6 h-6 rounded-md bg-indigo-100/50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span>{t('settings.menu.profile')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push(`/${locale}/settings/security`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-600 dark:hover:text-green-400 transition-all duration-150 group"
                      >
                        <div className="w-6 h-6 rounded-md bg-green-100/50 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <span>{t('settings.menu.security')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push(`/${locale}/settings/billing`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-150 group"
                      >
                        <div className="w-6 h-6 rounded-md bg-purple-100/50 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <span>{t('settings.menu.billing')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          router.push(`/${locale}/settings/notifications`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-150 group"
                      >
                        <div className="w-6 h-6 rounded-md bg-orange-100/50 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <span>{t('settings.menu.notifications')}</span>
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-indigo-200/30 dark:border-indigo-800/30 py-1">
                      <button
                        onClick={() => {
                          setShowAccountMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 group"
                      >
                        <div className="w-6 h-6 rounded-md bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                          <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="font-medium">{t('dashboard.accountMenu.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !isAuthPage && (
              <button
                onClick={() => router.push(`/${locale}/login`)}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                {locale === 'tr' ? 'Giriş Yap' : 'Login'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
