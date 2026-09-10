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
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      setGeneratedHtml(result.html);

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
          status: "draft",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save website");
      }

      alert(locale === "tr"
        ? "✅ Site kaydedildi! Dashboard'a yönlendiriliyorsunuz..."
        : "✅ Website saved! Redirecting to dashboard...");

      router.push(`/${locale}/dashboard`);

    } catch (error: any) {
      console.error("Save error:", error);
      alert(locale === "tr"
        ? `❌ Kaydetme hatası: ${error.message}`
        : `❌ Save error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">
              🤖 AI Web Sitesi Oluşturucu
            </h1>
          </div>

          {generatedHtml && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder={locale === "tr" ? "Site adı..." : "Website name..."}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSave}
                disabled={isSaving || !websiteName.trim()}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col border-r border-slate-700/50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700/50 text-slate-100'
                    }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 bg-slate-900/50 border-t border-slate-700/50">
            <div className="flex items-end gap-3">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={locale === "tr"
                  ? "Mesajınızı yazın... (Enter: gönder, Shift+Enter: yeni satır)"
                  : "Type your message... (Enter: send, Shift+Enter: new line)"}
                rows={3}
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                disabled={isGenerating}
              />
              <button
                onClick={handleSendMessage}
                disabled={isGenerating || !inputMessage.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2 h-fit"
              >
                {isGenerating ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col bg-slate-800/50">
          {generatedHtml ? (
            <>
              <div className="flex-shrink-0 px-4 py-3 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
                <span className="text-sm text-slate-300 font-medium">
                  {locale === "tr" ? "Önizleme" : "Preview"}
                </span>
                <button
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.open();
                      win.document.write(generatedHtml);
                      win.document.close();
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                >
                  {locale === "tr" ? "Tam Ekran" : "Full Screen"}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
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
              <div className="text-center text-slate-400 space-y-4">
                <svg className="w-20 h-20 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">
                  {locale === "tr" ? "Henüz site oluşturulmadı" : "No website created yet"}
                </p>
                <p className="text-sm">
                  {locale === "tr"
                    ? "Soldaki chat'te mesaj göndererek başlayın"
                    : "Start by sending a message in the chat"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
