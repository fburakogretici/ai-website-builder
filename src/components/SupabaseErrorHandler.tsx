"use client";

import { useEffect } from 'react';

/**
 * Supabase SSL/Certificate hatalarını yakalar ve localStorage'daki
 * bozuk token'ları temizler. Uygulama açılışında bir kez çalışır.
 */
export default function SupabaseErrorHandler() {
  useEffect(() => {
    // Sadece client-side'da çalış
    if (typeof window === 'undefined') return;

    // Console error'ları yakala ve Supabase hatalarını bastır
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      
      // Supabase SSL/Certificate hatalarını bastır
      if (
        message.includes('ERR_CERT_AUTHORITY_INVALID') ||
        message.includes('Failed to fetch') ||
        message.includes('supabase.co/auth')
      ) {
        // Sessizce logla ama kullanıcıyı rahatsız etme
        console.warn('Supabase connection issue (suppressed):', message);
        return;
      }
      
      // Diğer hatalar normal şekilde gösterilsin
      originalError.apply(console, args);
    };

    // Bozuk token'ları temizle
    const clearBrokenTokens = () => {
      try {
        const authKey = 'nocodepage-auth';
        const storedAuth = localStorage.getItem(authKey);
        
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          
          // Eğer token var ama expired veya geçersizse temizle
          if (authData.expires_at && authData.expires_at < Date.now() / 1000) {
            console.log('Clearing expired Supabase session...');
            localStorage.removeItem(authKey);
          }
        }
      } catch (error) {
        console.warn('Failed to clean up auth tokens:', error);
      }
    };

    clearBrokenTokens();

    // Cleanup
    return () => {
      console.error = originalError;
    };
  }, []);

  return null; // Bu component hiçbir şey render etmez
}
