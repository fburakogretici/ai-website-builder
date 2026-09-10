"use client";

import { useCallback, useEffect, useState } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { EMPTY_PROFILE, extractUserProfile, type UserProfile } from '@/utils/profile';

interface UseUserProfileOptions {
  supabase: SupabaseClient | null;
  session?: Session | null;
  listenForUpdates?: boolean;
}

interface UseUserProfileResult {
  profile: UserProfile;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UPDATE_EVENT_NAME = 'profile-updated';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function useUserProfile({
  supabase,
  session,
  listenForUpdates = true,
}: UseUserProfileOptions): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyUserProfile = useCallback((user?: User | null) => {
    setProfile(extractUserProfile(user));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (session?.user) {
      applyUserProfile(session.user);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.getUser();

      if (!error) {
        applyUserProfile(data?.user ?? null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }

    setIsLoading(false);
  }, [applyUserProfile, session, supabase]);

  useEffect(() => {
    if (session?.user) {
      applyUserProfile(session.user);
      setIsLoading(false);
      return;
    }

    refreshProfile();
  }, [applyUserProfile, refreshProfile, session]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile, session]);

  useEffect(() => {
    if (!listenForUpdates || !isBrowser()) {
      return;
    }

    const handler = () => {
      refreshProfile();
    };

    window.addEventListener(UPDATE_EVENT_NAME, handler);
    return () => {
      window.removeEventListener(UPDATE_EVENT_NAME, handler);
    };
  }, [refreshProfile, listenForUpdates]);

  return {
    profile,
    isLoading,
    refreshProfile,
  };
}
