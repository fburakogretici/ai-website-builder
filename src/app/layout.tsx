import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { locales } from '@/i18n';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nocodepage.tech'),
  title: {
    default: 'NoCodePage - AI-Powered Website Builder',
    template: '%s | NoCodePage'
  },
  description: 'Create professional websites instantly with AI. No coding required. Build stunning websites in minutes with our AI-powered website builder.',
  keywords: ['AI website builder', 'no code website builder', 'AI web design', 'website creator', 'free website builder', 'yapay zeka web sitesi', 'no-code'],
  authors: [{ name: 'NoCodePage' }],
  creator: 'NoCodePage',
  publisher: 'NoCodePage',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['tr_TR'],
    url: 'https://nocodepage.tech',
    title: 'NoCodePage - AI-Powered Website Builder',
    description: 'Create professional websites instantly with AI. No coding required.',
    siteName: 'NoCodePage',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NoCodePage - AI Website Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoCodePage - AI-Powered Website Builder',
    description: 'Create professional websites instantly with AI. No coding required.',
    images: ['/og-image.png'],
    creator: '@nocodepage',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'QKkbm5KBW63qu1jing-MymusN6zsYIH3qh85SNxq9Vs',
  },
};

import { ThemeProvider } from "@/contexts/ThemeContext";

// This is the root layout - provides html shell for locale layouts
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
