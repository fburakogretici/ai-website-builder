"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useSupabaseClient(): SupabaseClient | null {
  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    // Client-side'da çalıştığından emin ol
    if (typeof window !== 'undefined') {
      const supabaseClient = createBrowserClient();
      setClient(supabaseClient);
    }
  }, []);

  return client;
}
