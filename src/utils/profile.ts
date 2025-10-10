import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  metadata: Record<string, unknown>;
}

export const EMPTY_PROFILE: UserProfile = {
  id: '',
  email: '',
  displayName: '',
  avatarUrl: '',
  metadata: {},
};

export function extractUserProfile(user?: User | null): UserProfile {
  if (!user) {
    return { ...EMPTY_PROFILE };
  }

  const metadata = user.user_metadata ?? {};
  const providerProfiles = user.identities?.map((identity) => identity?.identity_data ?? {}) ?? [];
  const firstProfileWithAvatar = providerProfiles.find((identity: Record<string, unknown>) => {
    const picture = identity?.picture as string | undefined;
    const avatarUrl = identity?.avatar_url as string | undefined;
    return Boolean(picture || avatarUrl);
  }) ?? {};

  const fallbackName = user.email?.split('@')[0] ?? '';

  const displayName =
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    (firstProfileWithAvatar.full_name as string | undefined) ||
    (firstProfileWithAvatar.name as string | undefined) ||
    fallbackName;

  const avatarUrl =
    (metadata.avatar_url as string | undefined) ||
    (metadata.picture as string | undefined) ||
    (firstProfileWithAvatar.avatar_url as string | undefined) ||
    (firstProfileWithAvatar.picture as string | undefined) ||
    '';

  return {
    id: user.id,
    email: user.email ?? '',
    displayName,
    avatarUrl,
    metadata,
  };
}
