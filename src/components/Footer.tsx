"use client";

import { useRouter } from "next/navigation";
import { useLocale } from 'next-intl';
import { toast } from "sonner";

export default function Footer() {
  const router = useRouter();
  const locale = useLocale();

  return (
    <footer className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">

          {/* Brand Section - Takes more space */}
          <div className="lg:col-span-4 -mt-4">
            <div className="mb-4 group -ml-5">
              <img
                src="/nocodepage_logo.png"
                alt="NoCodePage"
                className="h-16 w-auto invert dark:invert-0 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {locale === 'tr'
                ? 'AI ile dakikalar içinde profesyonel web siteleri oluşturun.'
                : 'Create professional websites in minutes with AI.'}
            </p>

            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{locale === 'tr' ? 'Bültene Abone Ol' : 'Subscribe to Newsletter'}</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem('email') as HTMLInputElement;
                  const email = input.value;

                  if (!email) return;

                  const button = form.querySelector('button');
                  if (button) button.disabled = true;

                  try {
                    const res = await fetch('/api/newsletter/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    });

                    if (!res.ok) throw new Error('Subscription failed');

                    toast.success(locale === 'tr' ? 'Bültene başarıyla abone oldunuz! 🎉' : 'Successfully subscribed to newsletter! 🎉');
                    input.value = '';
                  } catch (error) {
                    toast.error(locale === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'Something went wrong. Please try again.');
                  } finally {
                    if (button) button.disabled = false;
                  }
                }}
                className="flex gap-2"
              >
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={locale === 'tr' ? 'E-posta adresiniz' : 'Your email'}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                />
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Product Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">{locale === 'tr' ? 'Ürün' : 'Product'}</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => router.push(`/${locale}#features`)}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-200 text-sm flex items-center group"
                >
                  <span className="w-0 group-hover:w-4 h-0.5 bg-indigo-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Özellikler' : 'Features'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/${locale}#pricing`)}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group"
                >
                  <span className="w-0 group-hover:w-4 h-0.5 bg-indigo-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Fiyatlandırma' : 'Pricing'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group"
                >
                  <span className="w-0 group-hover:w-4 h-0.5 bg-indigo-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">{locale === 'tr' ? 'Şirket' : 'Company'}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-purple-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Hakkımızda' : 'About'}
                </a>
              </li>
              <li>
                <a href={`/${locale}/blog`} className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-purple-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-purple-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'İletişim' : 'Contact'}
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">{locale === 'tr' ? 'Destek' : 'Support'}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-pink-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Yardım Merkezi' : 'Help Center'}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-pink-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Dokümantasyon' : 'Documentation'}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-pink-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Durum' : 'Status'}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">{locale === 'tr' ? 'Yasal' : 'Legal'}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-indigo-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Gizlilik' : 'Privacy'}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-indigo-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Şartlar' : 'Terms'}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group">
                  <span className="w-0 group-hover:w-4 h-0.5 bg-indigo-500 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  {locale === 'tr' ? 'Çerezler' : 'Cookies'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider with gradient */}
        <div className="relative h-px mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center md:text-left">
            © {new Date().getFullYear()} <span className="font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">NoCodePage</span>. {locale === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white hover:bg-purple-600 hover:border-purple-600 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white hover:bg-pink-600 hover:border-pink-600 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/25"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
