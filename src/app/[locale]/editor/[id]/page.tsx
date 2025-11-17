"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const websiteId = params.id as string;

  const [website, setWebsite] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    loadWebsite();
  }, [websiteId]);

  const loadWebsite = async () => {
    try {
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();

      const { data, error } = await supabase
        .from("websites")
        .select("*")
        .eq("id", websiteId)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      setWebsite(data);
      setHtmlContent(data.html_content);
      setIsLoading(false);
    } catch (error) {
      console.error("Load error:", error);
      alert(locale === "tr" ? "Site yüklenemedi" : "Failed to load website");
      router.push(`/${locale}/dashboard`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from("websites")
        .update({ 
          html_content: htmlContent
        })
        .eq("id", websiteId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      alert(locale === "tr" ? "✅ Kaydedildi!" : "✅ Saved!");
      await loadWebsite(); // Refresh website data
    } catch (error) {
      console.error("Save error:", error);
      alert(locale === "tr" ? "Kaydetme hatası" : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm(locale === "tr" 
      ? "Siteyi canlıya almak istediğinize emin misiniz?" 
      : "Are you sure you want to publish this site?")) {
      return;
    }

    setIsPublishing(true);
    try {
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from("websites")
        .update({ 
          status: "active"
        })
        .eq("id", websiteId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      alert(locale === "tr" ? "🎉 Site yayında!" : "🎉 Site is now live!");
      await loadWebsite(); // Refresh website data
    } catch (error) {
      console.error("Publish error:", error);
      alert(locale === "tr" ? "Yayınlama hatası" : "Publish failed");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm(locale === "tr" 
      ? "Siteyi yayından kaldırmak istediğinize emin misiniz?" 
      : "Are you sure you want to unpublish this site?")) {
      return;
    }

    setIsPublishing(true);
    try {
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from("websites")
        .update({ 
          status: "draft"
        })
        .eq("id", websiteId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      alert(locale === "tr" ? "📝 Site taslağa alındı" : "📝 Site moved to draft");
      await loadWebsite(); // Refresh website data
    } catch (error) {
      console.error("Unpublish error:", error);
      alert(locale === "tr" ? "Yayından kaldırma hatası" : "Unpublish failed");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAIRegenerate = async (sectionName: string, prompt: string) => {
    // TODO: AI ile section'ı yeniden oluştur
    alert(locale === "tr" 
      ? `AI regeneration için: ${sectionName}\nPrompt: ${prompt}` 
      : `AI regeneration for: ${sectionName}\nPrompt: ${prompt}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {locale === "tr" ? "Yükleniyor..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ✏️ {website?.name || "Website Editor"}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === "tr" ? "Sitenizi düzenleyin" : "Edit your website"}
                </p>
              </div>
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {website?.status === 'active' ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-sm font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {locale === "tr" ? "Yayında" : "Live"}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                    📝 {locale === "tr" ? "Taslak" : "Draft"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {locale === "tr" ? "← Dashboard" : "← Dashboard"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {locale === "tr" ? "Kaydediliyor..." : "Saving..."}
                  </>
                ) : (
                  <>💾 {locale === "tr" ? "Kaydet" : "Save"}</>
                )}
              </button>
              {website?.status === 'draft' ? (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {locale === "tr" ? "Yayınlanıyor..." : "Publishing..."}
                    </>
                  ) : (
                    <>🚀 {locale === "tr" ? "Yayınla" : "Publish"}</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {locale === "tr" ? "İşleniyor..." : "Processing..."}
                    </>
                  ) : (
                    <>📝 {locale === "tr" ? "Taslağa Al" : "Unpublish"}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {locale === "tr" ? "HTML Kodu" : "HTML Code"}
                </h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(htmlContent);
                    alert(locale === "tr" ? "Kopyalandı!" : "Copied!");
                  }}
                  className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  📋 {locale === "tr" ? "Kopyala" : "Copy"}
                </button>
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full h-[600px] px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Preview & Tools */}
          <div className="space-y-4">
            {/* Live Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {locale === "tr" ? "Canlı Önizleme" : "Live Preview"}
              </h3>
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-full"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>

            {/* AI Tools */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                🤖 {locale === "tr" ? "AI Araçları" : "AI Tools"}
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => alert(locale === "tr" ? "Yakında eklenecek!" : "Coming soon!")}
                  className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left"
                >
                  <div className="font-semibold">✨ {locale === "tr" ? "AI ile İyileştir" : "AI Enhance"}</div>
                  <div className="text-sm opacity-80">{locale === "tr" ? "Tasarımı otomatik iyileştir" : "Auto-improve design"}</div>
                </button>
                <button
                  onClick={() => alert(locale === "tr" ? "Yakında eklenecek!" : "Coming soon!")}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left"
                >
                  <div className="font-semibold">🎨 {locale === "tr" ? "Renkleri Değiştir" : "Change Colors"}</div>
                  <div className="text-sm opacity-80">{locale === "tr" ? "AI ile yeni palet" : "AI color palette"}</div>
                </button>
                <button
                  onClick={() => alert(locale === "tr" ? "Yakında eklenecek!" : "Coming soon!")}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left"
                >
                  <div className="font-semibold">📝 {locale === "tr" ? "İçerikleri Yenile" : "Refresh Content"}</div>
                  <div className="text-sm opacity-80">{locale === "tr" ? "Metinleri yeniden yaz" : "Rewrite text"}</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
