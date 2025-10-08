"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n';
import { useTransition } from 'react';

const TurkeyFlag = () => (
  <svg className="w-5 h-5" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#E30A17"/>
    <g transform="translate(16, 16)">
      <circle cx="-2" cy="0" r="5" fill="#fff"/>
      <circle cx="-1" cy="0" r="4" fill="#E30A17"/>
      <path d="M3.5 -1.5 L4.2 0.8 L2 -0.5 L5 -0.5 L2.8 0.8 Z" fill="#fff"/>
    </g>
  </svg>
);

const UKFlag = () => (
  <svg className="w-5 h-5" viewBox="0 0 32 32">
    <defs>
      <clipPath id="circle-clip">
        <circle cx="16" cy="16" r="16"/>
      </clipPath>
    </defs>
    <g clipPath="url(#circle-clip)">
      <rect width="32" height="32" fill="#012169"/>
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#fff" strokeWidth="5.5"/>
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="3.5"/>
      <path d="M16 0 V32 M0 16 H32" stroke="#fff" strokeWidth="5.5"/>
      <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="3.5"/>
    </g>
  </svg>
);

const languageLabels = {
  tr: 'TR',
  en: 'EN'
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return; // Already on this locale
    
    // Remove current locale from the pathname
    // e.g., /en/dashboard -> /dashboard or /en -> /
    let pathWithoutLocale = pathname;
    if (pathname.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathname.slice(`/${locale}`.length) || '/';
    }
    
    // Build new path with new locale
    const newPath = pathWithoutLocale === '/' 
      ? `/${newLocale}` 
      : `/${newLocale}${pathWithoutLocale}`;
    
    startTransition(() => {
      router.replace(newPath);
      router.refresh();
    });
  };

  const flags = {
    tr: <TurkeyFlag />,
    en: <UKFlag />
  };

  return (
    <div className="flex items-center gap-0.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/30 rounded-lg p-0.5 border border-gray-200/50 dark:border-gray-700/50">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLanguageChange(loc)}
          disabled={isPending || locale === loc}
          title={loc === 'tr' ? 'Türkçe' : 'English'}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${
            locale === loc
              ? 'bg-white dark:bg-gray-700 shadow-sm ring-1 ring-indigo-500/20 dark:ring-indigo-400/20'
              : 'hover:bg-white/50 dark:hover:bg-gray-700/50 opacity-50 hover:opacity-100'
          } ${isPending ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className={`w-5 h-5 ${locale === loc ? '' : 'grayscale-[30%]'}`}>
            {flags[loc as keyof typeof flags]}
          </div>
        </button>
      ))}
    </div>
  );
}
