"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from './Navbar';
import Footer from './Footer';
import SupabaseErrorHandler from './SupabaseErrorHandler';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const supabase = useSupabaseClient();

  // Routes that should not show navbar and footer
  const noLayoutRoutes = ['/forgot-password', '/reset-password', '/ai-builder', '/editor'];
  const shouldShowLayout = !noLayoutRoutes.some(route => pathname?.includes(route));

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !supabase) return;

    // Check session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        // Supabase hatalarını sessizce logla
        console.warn('Session check failed (non-critical):', error);
      }
    };
    
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, isClient]);

  if (!shouldShowLayout) {
    // For login, forgot-password, reset-password pages - no layout
    return (
      <>
        <SupabaseErrorHandler />
        {children}
      </>
    );
  }

  return (
    <>
      <SupabaseErrorHandler />
      <div>
        <Navbar session={session} />
      </div>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
