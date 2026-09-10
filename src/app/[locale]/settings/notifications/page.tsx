"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useLocale } from "next-intl";

export default function NotificationsPage() {
  const supabase = useSupabaseClient();
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState({
    newWebsite: true,
    weeklyReport: true,
    promotions: false,
    securityAlerts: true,
  });

  const [pushNotifications, setPushNotifications] = useState({
    browserPush: false,
    mobilePush: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
          console.error('Error fetching settings:', error);
          return;
        }

        if (data) {
          setEmailNotifications({
            newWebsite: data.new_website,
            weeklyReport: data.weekly_report,
            promotions: data.promotions,
            securityAlerts: data.security_alerts,
          });
          setPushNotifications({
            browserPush: data.browser_push,
            mobilePush: data.mobile_push,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [supabase]);

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(locale === 'tr' ? 'Oturum açmanız gerekiyor.' : 'You need to be logged in.');
        return;
      }

      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          new_website: emailNotifications.newWebsite,
          weekly_report: emailNotifications.weeklyReport,
          promotions: emailNotifications.promotions,
          security_alerts: emailNotifications.securityAlerts,
          browser_push: pushNotifications.browserPush,
          mobile_push: pushNotifications.mobilePush,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success(locale === 'tr' ? 'Bildirim ayarları kaydedildi!' : 'Notification settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(locale === 'tr' ? 'Ayarlar kaydedilirken bir hata oluştu.' : 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="text-2xl font-bold text-white">
            {locale === 'tr' ? 'Bildirim Tercihleri' : 'Notification Preferences'}
          </h2>
          <p className="text-indigo-100 mt-1">
            {locale === 'tr' ? 'Hangi bildirimleri almak istediğinizi seçin' : 'Choose which notifications you want to receive'}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Notifications Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              {locale === 'tr' ? '📧 E-posta Bildirimleri' : '📧 Email Notifications'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {locale === 'tr' ? 'Yeni Web Sitesi Oluşturuldu' : 'New Website Created'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'tr' ? 'Web siteniz hazır olduğunda bildirim alın' : 'Get notified when your website is ready'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.newWebsite}
                    onChange={(e) => setEmailNotifications({ ...emailNotifications, newWebsite: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {locale === 'tr' ? 'Haftalık Rapor' : 'Weekly Report'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'tr' ? 'Sitelerinizin haftalık istatistiklerini alın' : 'Get weekly statistics for your sites'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.weeklyReport}
                    onChange={(e) => setEmailNotifications({ ...emailNotifications, weeklyReport: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {locale === 'tr' ? 'Promosyonlar ve Kampanyalar' : 'Promotions and Campaigns'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'tr' ? 'Yeni özellikler ve özel teklifler hakkında bilgi alın' : 'Get info about new features and special offers'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.promotions}
                    onChange={(e) => setEmailNotifications({ ...emailNotifications, promotions: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {locale === 'tr' ? 'Güvenlik Uyarıları' : 'Security Alerts'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'tr' ? 'Hesap güvenliğinizle ilgili önemli bildirimler' : 'Important notifications about your account security'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications.securityAlerts}
                    onChange={(e) => setEmailNotifications({ ...emailNotifications, securityAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Push Notifications Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              {locale === 'tr' ? '🔔 Push Bildirimleri' : '🔔 Push Notifications'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {locale === 'tr' ? 'Tarayıcı Bildirimleri' : 'Browser Notifications'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'tr' ? 'Tarayıcınızda anlık bildirimler alın' : 'Get instant notifications in your browser'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications.browserPush}
                    onChange={(e) => setPushNotifications({ ...pushNotifications, browserPush: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {locale === 'tr' ? 'Mobil Uygulama Bildirimleri' : 'Mobile App Notifications'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'tr' ? 'Mobil cihazınızda bildirim alın' : 'Get notifications on your mobile device'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushNotifications.mobilePush}
                    onChange={(e) => setPushNotifications({ ...pushNotifications, mobilePush: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {locale === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
