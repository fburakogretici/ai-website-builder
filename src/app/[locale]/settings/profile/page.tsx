"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from 'next-intl';
import Avatar from '@/components/Avatar';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations();
  const locale = useLocale();

  const supabase = useSupabaseClient();
  const { profile, refreshProfile } = useUserProfile({ supabase });

  useEffect(() => {
    const fullNameFromMetadata =
      getStringMetadata(profile.metadata, 'full_name') ||
      getStringMetadata(profile.metadata, 'name') ||
      profile.displayName;

    setEmail(profile.email);
    setFullName(fullNameFromMetadata);
    setUsername(getStringMetadata(profile.metadata, 'username'));
    setBio(getStringMetadata(profile.metadata, 'bio'));
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!supabase) {
        setMessage({ type: "error", text: locale === 'tr' ? 'Bağlantı hatası!' : 'Connection error!' });
        setUploading(false);
        return;
      }

      if (!e.target.files || e.target.files.length === 0) {
        setUploading(false);
        return;
      }

      const file = e.target.files[0];
      const fileSize = file.size / 1024 / 1024;

      if (fileSize > 2) {
        setMessage({ type: "error", text: locale === 'tr' ? 'Dosya boyutu 2MB\'dan küçük olmalıdır!' : 'File size must be less than 2MB!' });
        setUploading(false);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage({ type: "error", text: locale === 'tr' ? 'Sadece resim dosyaları yüklenebilir!' : 'Only image files can be uploaded!' });
        setUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const { error } = await supabase.auth.updateUser({
          data: {
            avatar_url: base64String,
          },
        });

        setUploading(false);

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setAvatarUrl(base64String);
          setMessage({ type: "success", text: locale === 'tr' ? 'Profil fotoğrafı yüklendi!' : 'Profile photo uploaded!' });
          await refreshProfile();
          window.dispatchEvent(new Event('profile-updated'));
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      const errorMessage = error instanceof Error ? error.message : (locale === 'tr' ? 'Beklenmeyen bir hata oluştu.' : 'An unexpected error occurred.');
      setMessage({ type: "error", text: errorMessage });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!supabase) {
      setMessage({ type: "error", text: locale === 'tr' ? 'Bağlantı hatası!' : 'Connection error!' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        name: fullName,
        username: username,
        bio: bio,
        avatar_url: avatarUrl,
      },
    });

    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: t('settings.profile.error') });
    } else {
      setMessage({ type: "success", text: t('settings.profile.success') });
      await refreshProfile();
      window.dispatchEvent(new Event('profile-updated'));
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings.profile.title')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('settings.profile.subtitle')}</p>
      </div>

      <div className="p-6">
        {message && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                src={avatarUrl}
                alt={locale === 'tr' ? 'Profil fotoğrafı' : 'Profile avatar'}
                className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-lg"
                imageClassName="w-full h-full object-cover"
                onFallback={() => setAvatarUrl("")}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg p-1.5 shadow-md hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">{t('settings.profile.uploadAvatar')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {locale === 'tr' ? 'JPG, PNG. Maksimum 2MB.' : 'JPG, PNG. Max 2MB.'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.profile.email')}
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              {locale === 'tr' ? 'E-posta değiştirilemez' : 'Email cannot be changed'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.profile.fullName')}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('settings.profile.fullNamePlaceholder')}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.profile.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('settings.profile.usernamePlaceholder')}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.profile.bio')}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('settings.profile.bioPlaceholder')}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 dark:text-white transition-all duration-200 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              {locale === 'tr' ? 'Maksimum 200 karakter' : 'Maximum 200 characters'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                void refreshProfile();
              }}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('settings.profile.saveButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getStringMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === 'string' ? value : '';
}
