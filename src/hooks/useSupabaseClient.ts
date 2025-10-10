"use client";

import { useMemo } from 'react';
import { createBrowserClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export function useSupabaseClient(): SupabaseClient {
  return useMemo(() => createBrowserClient(), []);
}
