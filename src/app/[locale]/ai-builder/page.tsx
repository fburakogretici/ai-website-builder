"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

type GenerationStep = "input" | "generating" | "preview";

export default function AIBuilderPage() {
  const router = useRouter();
  const locale = useLocale();

  const [currentStep, setCurrentStep] = useState<GenerationStep>("input");
  const [userPrompt, setUserPrompt] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedWebsiteId, setSavedWebsiteId] = useState<string | null>(null);

  const examplePrompts = locale === "tr" ? [
    "Modern bir kafe için web sitesi. Adı 'Kahve Dükkanı', İstanbul'da özel kahveler satıyoruz",
    "Grafik tasarım portföy sitesi, minimalist ve yaratıcı",
    "Yazılım danışmanlık firması, kurumsal web sitesi",
    "E-ticaret sitesi, teknoloji ürünleri satıyoruz",
  ] : [
    "Modern coffee shop website. Name is 'Coffee House', selling specialty coffee in Istanbul",
    "Graphic design portfolio site, minimalist and creative",
    "Software consulting firm, corporate website",
    "E-commerce site selling tech products",
  ];

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError(locale === "tr" ? "Lütfen bir açıklama girin" : "Please enter a description");
      return;
    }

    setError("");
    setCurrentStep("generating");

    try {
      console.log("🚀 Direct generation (no analysis step)...");

      const generateResponse = await fetch("/api/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          locale: locale,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.details || "Generation failed");
      }

      const generateResult = await generateResponse.json();
      setGeneratedHtml(generateResult.html);
      
      // Set basic analysis for save functionality
      setAnalysis({
        businessName: generateResult.businessName || "My Website",
        businessType: "website",
      });
      
      setCurrentStep("preview");

      console.log("✅ Complete HTML generated!");
      console.log(`📊 Tokens used: ${generateResult.tokensUsed}`);
      console.log(`⚡ Method: ${generateResult.method}`);

    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Something went wrong");
      setCurrentStep("input");
    }
  };

  const handleReset = () => {
    setCurrentStep("input");
    setUserPrompt("");
    setAnalysis(null);
    setGeneratedHtml("");
    setError("");
    setSavedWebsiteId(null);
  };

  const handleSaveWebsite = async () => {
    if (!generatedHtml || !analysis) {
      setError(locale === "tr" ? "Kaydedilecek site yok" : "No site to save");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Get user session
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/ai-builder`)}`);
        return;
      }

      const response = await fetch("/api/save-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          websiteName: analysis.businessName || "My Website",
          html: generatedHtml,
          analysis: analysis,
          prompt: userPrompt,
          status: "draft",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Save error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Server error: ${errorText.substring(0, 100)}`);
        }
        
        throw new Error(errorData.details || errorData.error || "Save failed");
      }

      const result = await response.json();
      setSavedWebsiteId(result.websiteId);
      
      if (confirm(locale === "tr" 
        ? `✅ Site taslak olarak kaydedildi!\n\nDashboard'a gidip düzenlemek ister misiniz?` 
        : `✅ Site saved as draft!\n\nGo to dashboard to edit?`)) {
        router.push(`/${locale}/dashboard`);
      }

    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save");
      alert(locale === "tr" 
        ? `❌ Kaydetme hatası: ${err.message}` 
        : `❌ Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              🤖 AI Web Sitesi Oluşturucu
            </h1>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {locale === "tr" ? "← Dashboard" : "← Dashboard"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Input Step */}
        {currentStep === "input" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {locale === "tr" 
                  ? "Web sitenizi anlatın, biz halledelim" 
                  : "Describe your website, we'll handle it"}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {locale === "tr"
                  ? "Yapay zeka birkaç saniye içinde profesyonel web sitenizi oluşturacak"
                  : "AI will create your professional website in seconds"}
              </p>
            </div>

            {/* Prompt Textarea */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border-2 border-purple-200 dark:border-purple-800">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={locale === "tr"
                  ? "Örnek: Modern bir kafe için web sitesi istiyorum. Adı 'Kahve Dükkanı', İstanbul'da özel kahveler ve ev yapımı tatlılar satıyoruz. Hedef kitle genç profesyoneller..."
                  : "Example: I want a website for a modern coffee shop. Name is 'Coffee House', selling specialty coffee and homemade desserts in Istanbul. Target audience is young professionals..."}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all resize-none text-lg"
              />

              {error && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  ⚠️ {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!userPrompt.trim()}
                className="mt-6 w-full py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6h6V7z" />
                  <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                </svg>
                {locale === "tr" ? "🚀 Web Sitemi Oluştur" : "🚀 Create My Website"}
              </button>
            </div>

            {/* Example Prompts */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                💡 {locale === "tr" ? "Örnek Promptlar:" : "Example Prompts:"}
              </p>
              <div className="grid gap-3">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUserPrompt(example)}
                    className="text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generating Step */}
        {currentStep === "generating" && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="inline-block p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
              <div className="relative">
                <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">✨</span>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {locale === "tr" ? "🎨 AI web sitenizi oluşturuyor..." : "🎨 AI is creating your website..."}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {locale === "tr" 
                ? "Tamamen özgün, responsive web siteniz hazırlanıyor. CSS, animasyonlar ve içerik dahil!" 
                : "Creating your completely original, responsive website. CSS, animations and content included!"}
            </p>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === "preview" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 {locale === "tr" ? "Web siteniz hazır!" : "Your website is ready!"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {locale === "tr" 
                  ? "Önizlemeyi inceleyin, beğendiyseniz yayınlayın" 
                  : "Review the preview, publish if you like it"}
              </p>
            </div>

            {/* Preview Frame */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {analysis?.businessName || "preview"}.nocodepage.ai
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.open();
                      win.document.write(generatedHtml);
                      win.document.close();
                    }
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {locale === "tr" ? "Tam Ekran" : "Full Screen"}
                </button>
              </div>
              
              <div className="w-full bg-gray-50 dark:bg-gray-900" style={{ height: '600px' }}>
                <iframe
                  srcDoc={generatedHtml}
                  className="w-full h-full border-0"
                  title="Website Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              {/* Main action - Save (most important) */}
              <button
                type="button"
                onClick={handleSaveWebsite}
                disabled={isSaving || savedWebsiteId !== null}
                className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {locale === "tr" ? "Kaydediliyor..." : "Saving..."}
                  </>
                ) : savedWebsiteId ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {locale === "tr" ? "Kaydedildi!" : "Saved!"}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {locale === "tr" ? "💾 Kaydet (Taslak)" : "💾 Save (Draft)"}
                  </>
                )}
              </button>

              {/* Info message */}
              {!savedWebsiteId && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {locale === "tr" 
                    ? "💡 Site taslak olarak kaydedilecek. Dashboard'dan düzenleyip yayınlayabilirsiniz." 
                    : "💡 Site will be saved as draft. You can edit and publish from dashboard."}
                </p>
              )}

              {/* Go to Dashboard button - Shows after save */}
              {savedWebsiteId && (
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {locale === "tr" ? "🎨 Sitelerimi Görüntüle" : "🎨 View My Sites"}
                </button>
              )}

              {/* Secondary actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([generatedHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${analysis?.businessName || 'website'}.html`;
                    a.click();
                  }}
                  className="py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {locale === "tr" ? "HTML İndir" : "Download HTML"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {locale === "tr" ? "Yeni Site" : "New Site"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
