"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from './Navbar';
import Footer from './Footer';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const supabase = useSupabaseClient();

  // Routes that should not show navbar and footer
  const noLayoutRoutes = ['/forgot-password', '/reset-password'];
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
        console.error('Session check error:', error);
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
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar session={session} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
