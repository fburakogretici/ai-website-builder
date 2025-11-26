"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIBuilderPage() {
  const router = useRouter();
  const locale = useLocale();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [websiteStatus, setWebsiteStatus] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // History management for undo/redo
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = locale === "tr"
        ? "Merhaba! 👋 Ben AI web sitesi asistanınızım.\n\nİstediğiniz web sitesini anlatın, ben sizin için oluşturayım. Örneğin:\n\n• \"Modern bir kafe için web sitesi istiyorum. Adı 'Kahve Dükkanı'...\"\n• \"Grafik tasarım portföy sitesi, minimalist ve yaratıcı\"\n• \"Yazılım danışmanlık firması web sitesi\"\n\nHazır olduğunuzda mesajınızı yazıp gönderin!"
        : "Hello! 👋 I'm your AI website assistant.\n\nDescribe the website you want, and I'll create it for you. For example:\n\n• \"I want a website for a modern coffee shop. Name is 'Coffee House'...\"\n• \"Graphic design portfolio site, minimalist and creative\"\n• \"Software consulting firm website\"\n\nWhen ready, type your message and send!";

      setMessages([{
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date()
      }]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inputMessage,
          currentHtml: generatedHtml || null,
          locale: locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Generation failed");
      }

      const result = await response.json();

      // Add to history
      const newHtml = result.html;
      setHtmlHistory(prev => {
        const newHistory = [...prev.slice(0, historyIndex + 1), newHtml];
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      setGeneratedHtml(newHtml);

      if (result.businessName && !websiteName) {
        setWebsiteName(result.businessName);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.explanation || (locale === "tr"
          ? "✅ Web siteniz hazır! Sağ tarafta önizleyebilirsiniz."
          : "✅ Your website is ready! Preview it on the right."),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error("Generation error:", error);
      const errorMessage: Message = {
        role: 'assistant',
        content: locale === "tr"
          ? `❌ Üzgünüm, bir hata oluştu: ${error.message}`
          : `❌ Sorry, an error occurred: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setGeneratedHtml(htmlHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < htmlHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setGeneratedHtml(htmlHistory[newIndex]);
    }
  };

  const handleSave = async () => {
    if (!generatedHtml) {
      alert(locale === "tr" ? "Önce bir site oluşturun" : "Create a website first");
      return;
    }

    if (!websiteName.trim()) {
      alert(locale === "tr" ? "Lütfen site adı girin" : "Please enter website name");
      return;
    }

    setIsSaving(true);

    try {
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
          websiteName: websiteName,
          html: generatedHtml,
          status: websiteStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save website");
      }

      const result = await response.json();
      if (result.websiteId && !websiteId) {
        setWebsiteId(result.websiteId);
      }

      alert(locale === "tr"
        ? "✅ Site kaydedildi!"
        : "✅ Website saved!");

    } catch (error: any) {
      console.error("Save error:", error);
      alert(locale === "tr"
        ? `❌ Kaydetme hatası: ${error.message}`
        : `❌ Save error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!websiteId) {
      alert(locale === "tr" ? "Önce siteyi kaydedin" : "Save the website first");
      return;
    }

    setIsPublishing(true);

    try {
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from('websites')
        .update({ status: 'published' })
        .eq('id', websiteId);

      if (error) throw error;

      setWebsiteStatus('published');
      alert(locale === "tr"
        ? "✅ Site yayınlandı!"
        : "✅ Website published!");

    } catch (error: any) {
      console.error("Publish error:", error);
      alert(locale === "tr"
        ? `❌ Yayınlama hatası: ${error.message}`
        : `❌ Publish error: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!websiteId) return;

    setIsPublishing(true);

    try {
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from('websites')
        .update({ status: 'draft' })
        .eq('id', websiteId);

      if (error) throw error;

      setWebsiteStatus('draft');
      alert(locale === "tr"
        ? "✅ Site yayından kaldırıldı"
        : "✅ Website unpublished");

    } catch (error: any) {
      console.error("Unpublish error:", error);
      alert(locale === "tr"
        ? `❌ Hata: ${error.message}`
        : `❌ Error: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden flex flex-col">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 px-8 py-3">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="group p-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-300"
                aria-label={locale === "tr" ? "Dashboard'a dön" : "Back to dashboard"}
              >
                <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-white/10">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                    {locale === "tr" ? "AI Builder" : "AI Builder"}
                  </h1>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                    {locale === "tr" ? "Yapay Zeka ile Web Sitesi" : "AI-Powered Website"}
                  </p>
                </div>
              </div>
            </div>

            {generatedHtml && (
              <div className="flex items-center gap-3">
                {/* Status Chip */}
                {websiteId && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${websiteStatus === 'published'
                    ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${websiteStatus === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {websiteStatus === 'published'
                      ? (locale === "tr" ? 'Yayında' : 'Live')
                      : (locale === "tr" ? 'Taslak' : 'Draft')}
                  </div>
                )}

                {/* Undo/Redo */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700/30 rounded-lg p-1 ring-1 ring-gray-200 dark:ring-white/5">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600/50 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= htmlHistory.length - 1}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-600/50 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                  </button>
                </div>

                {/* Site Name Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    placeholder={locale === "tr" ? "Site adı..." : "Site name..."}
                    className="px-3 py-2 bg-gray-100 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 text-sm w-40 transition-all"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !websiteName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                  {isSaving ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isSaving ? (locale === "tr" ? "..." : "...") : (locale === "tr" ? "Kaydet" : "Save")}
                </button>

                {/* Publish Button */}
                {websiteId && (
                  <button
                    onClick={websiteStatus === 'published' ? handleUnpublish : handlePublish}
                    disabled={isPublishing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${websiteStatus === 'published'
                      ? 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-600/80 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 ring-1 ring-gray-300 dark:ring-slate-500/50'
                      : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20'
                      }`}
                  >
                    {isPublishing ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : websiteStatus === 'published' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                    {isPublishing
                      ? "..."
                      : websiteStatus === 'published'
                        ? (locale === "tr" ? "Kaldır" : "Unpublish")
                        : (locale === "tr" ? "Yayınla" : "Publish")
                    }
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - ChatGPT Style */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1800px] mx-auto px-8 py-6 grid grid-cols-2 gap-6">
          {/* Left Panel - Chat */}
          <div className="flex flex-col bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden ring-1 ring-gray-200 dark:ring-white/5 shadow-xl dark:shadow-none">
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700/50 text-gray-800 dark:text-slate-100'
                    }`}>
                    <div className="flex items-start gap-3">
                      {message.role === 'assistant' && (
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-60 mt-2">
                          {message.timestamp.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-transparent">
              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={locale === 'tr' ? 'Mesajınızı yazın...' : 'Type your message...'}
                  className="flex-1 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
                  rows={2}
                  disabled={isGenerating}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isGenerating}
                  className="px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex flex-col bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden shadow-xl dark:shadow-none">
            {generatedHtml ? (
              <>
                <div className="flex-shrink-0 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400 ml-2">
                      {locale === "tr" ? "Önizleme" : "Preview"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.open();
                        win.document.write(generatedHtml);
                        win.document.close();
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-slate-700/50 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded transition-all flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {locale === "tr" ? "Tam Ekran" : "Fullscreen"}
                  </button>
                </div>
                <div className="flex-1 overflow-hidden bg-white">
                  <iframe
                    srcDoc={generatedHtml}
                    className="w-full h-full border-0"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center text-gray-500 dark:text-slate-400 space-y-4 max-w-sm">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      {locale === "tr" ? "Henüz site oluşturulmadı" : "No website yet"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                      {locale === "tr"
                        ? "Chat'te bir mesaj gönderin, AI sitenizi oluştursun."
                        : "Send a message in chat to create your site."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div >
  );
}
