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
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/40 backdrop-blur-xl border-b border-white/10 shadow-2xl z-50">
        <div className="max-w-[95%] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                aria-label={locale === "tr" ? "Dashboard'a dön" : "Back to dashboard"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    {locale === "tr" ? "AI Web Sitesi Oluşturucu" : "AI Website Builder"}
                  </h1>
                  <p className="text-xs text-slate-400">
                    {locale === "tr" ? "Yapay zeka ile saniyeler içinde web sitesi oluşturun" : "Create websites in seconds with AI"}
                  </p>
                </div>
              </div>
            </div>

            {generatedHtml && (
              <div className="flex items-center gap-3">
                {/* Status Chip */}
                {websiteId && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    websiteStatus === 'published' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {websiteStatus === 'published' 
                      ? (locale === "tr" ? '🟢 Yayında' : '🟢 Published')
                      : (locale === "tr" ? '🟡 Taslak' : '🟡 Draft')}
                  </div>
                )}
                
                {/* Undo/Redo Buttons */}
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={locale === "tr" ? "Geri Al (Ctrl+Z)" : "Undo (Ctrl+Z)"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= htmlHistory.length - 1}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={locale === "tr" ? "İleri Al (Ctrl+Y)" : "Redo (Ctrl+Y)"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                  </button>
                </div>
                
                <input
                  type="text"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  placeholder={locale === "tr" ? "Site adı..." : "Website name..."}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white/10 transition-all duration-200 min-w-[200px]"
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving || !websiteName.trim()}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-indigo-500/50"
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
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {locale === "tr" ? "Kaydet" : "Save"}
                    </>
                  )}
                </button>
                {websiteId && (
                  <button
                    onClick={websiteStatus === 'published' ? handleUnpublish : handlePublish}
                    disabled={isPublishing}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      websiteStatus === 'published'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-orange-500/50 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:shadow-green-500/50 text-white'
                    }`}
                  >
                    {isPublishing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {locale === "tr" ? "İşleniyor..." : "Processing..."}
                      </>
                    ) : websiteStatus === 'published' ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        {locale === "tr" ? "Yayından Kaldır" : "Unpublish"}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        {locale === "tr" ? "Yayınla" : "Publish"}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden max-w-[95%] mx-auto w-full gap-4 py-4">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className="flex items-start gap-3 max-w-[85%]">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                        : 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 text-slate-100 border border-white/5'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-60 mt-2.5 flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {message.timestamp.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center border border-white/10">
                      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 text-slate-100 border border-white/5 rounded-2xl px-5 py-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-slate-400">
                        {locale === "tr" ? "AI düşünüyor..." : "AI is thinking..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-5 bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-slate-900/95 border-t border-white/5">
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-300 transition-colors pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6a2 2 0 002-2V6a2 2 0 00-2-2H9a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={locale === "tr" 
                    ? "Mesajınızı yazın... (Enter: gönder, Shift+Enter: yeni satır)" 
                    : "Type your message... (Enter: send, Shift+Enter: new line)"}
                  rows={3}
                  className="w-full pl-14 pr-24 py-4 bg-white/5 border border-white/15 rounded-3xl text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 focus:bg-white/10 resize-none transition-all duration-200 shadow-inner shadow-black/10"
                  disabled={isGenerating}
                />
                <div className="absolute bottom-3 left-4 text-[11px] text-slate-500">
                  {inputMessage.length > 0 && `${inputMessage.length} ${locale === "tr" ? 'karakter' : 'characters'}`}
                </div>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={isGenerating || !inputMessage.trim()}
                  aria-label={locale === 'tr' ? 'Mesajı gönder' : 'Send message'}
                  className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:via-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white transition-all duration-200 flex items-center justify-center shadow-lg"
                >
                  {isGenerating ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="uppercase tracking-wide text-slate-400/90">{locale === 'tr' ? 'Önerilen istemler' : 'Suggested prompts'}</span>
                {[
                  locale === 'tr' ? 'Restoran menüsü' : 'Restaurant menu',
                  locale === 'tr' ? 'SaaS landing' : 'SaaS landing',
                  locale === 'tr' ? 'Kişisel portföy' : 'Personal portfolio'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setInputMessage(chip)}
                    className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:border-indigo-400/60 hover:text-white transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{locale === 'tr' ? 'Enter ile gönder • Shift + Enter yeni satır' : 'Enter to send • Shift + Enter for newline'}</span>
                <span>{locale === 'tr' ? 'AI yanıtları hatalar içerebilir' : 'AI responses may be inaccurate'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {generatedHtml ? (
            <>
              <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locale === "tr" ? "Canlı Önizleme" : "Live Preview"}
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
                  className="px-4 py-2 text-sm bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium border border-white/5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {locale === "tr" ? "Tam Ekran" : "Full Screen"}
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
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-slate-400 space-y-6 max-w-md">
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                    <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white mb-2">
                    {locale === "tr" ? "Henüz site oluşturulmadı" : "No website created yet"}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {locale === "tr" 
                      ? "Soldaki chat'te mesaj göndererek web sitenizi oluşturmaya başlayın. AI birkaç saniye içinde tamamen özelleştirilmiş bir site tasarlayacak." 
                      : "Start creating your website by sending a message in the chat. AI will design a fully customized site in seconds."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {locale === "tr" ? "AI destekli tasarım" : "AI-powered design"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {locale === "tr" ? "Sınırsız düzenleme" : "Unlimited edits"}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {locale === "tr" ? "Responsive tasarım" : "Responsive design"}
                  </div>
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
}
