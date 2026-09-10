'use client';

import { NextIntlClientProvider } from 'next-intl';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useEffect, useState } from 'react';

export default function BlogLayoutClient({
    children,
    params,
    messages,
}: {
    children: React.ReactNode;
    params: { locale: string };
    messages: any;
}) {
    const { locale } = params;
    const { theme, setTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            {/* Premium Top Bar */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                        ? 'py-3 bg-white/70 dark:bg-[#060606]/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-white/5 shadow-sm'
                        : 'py-6 bg-transparent border-b border-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href={`/${locale}`} className="flex items-center gap-3 group">
                        <img
                            src="/nocodepage_logo.png"
                            alt="NoCodePage"
                            className="h-12 w-auto transition-all duration-500 group-hover:scale-105 invert dark:invert-0"
                        />
                    </Link>

                    {/* Controls */}
                    <div className="flex items-center gap-6">
                        {/* Language Switcher */}
                        <div className="hidden md:block">
                            <LanguageSwitcher />
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="relative w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-500 group overflow-hidden"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            {theme === 'dark' ? (
                                <svg className="w-4 h-4 text-gray-600 dark:text-white/60 group-hover:dark:text-white transition-all duration-500 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-gray-600 dark:text-white/60 group-hover:text-amber-500 transition-all duration-500 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <main className="bg-white dark:bg-[#060606] min-h-screen transition-colors duration-500">
                {children}
            </main>
        </NextIntlClientProvider>
    );
}
