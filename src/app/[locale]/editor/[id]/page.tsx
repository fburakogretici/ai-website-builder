"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
  
  // History management for undo/redo
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldSkipInitialScroll = useRef(true);

  useEffect(() => {
    loadWebsite();
  }, [websiteId]);

  useEffect(() => {
    if (shouldSkipInitialScroll.current) {
      shouldSkipInitialScroll.current = false;
      return;
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  };

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
      
      // Initialize history with the loaded HTML
      setHtmlHistory([data.html_content]);
      setHistoryIndex(0);
      
      // Initialize with welcome message
      setMessages([{
        role: 'assistant',
        content: locale === 'tr' 
          ? `Merhaba! "${data.name}" sitenizi düzenlemeye hazırım. Ne yapmak istersiniz?\n\nÖrnek:\n- "Renkleri daha modern yap"\n- "Hero bölümünü daha çekici hale getir"\n- "İletişim formunu ekle"` 
          : `Hello! I'm ready to edit your "${data.name}" website. What would you like to do?\n\nExamples:\n- "Make colors more modern"\n- "Make hero section more attractive"\n- "Add contact form"`,
        timestamp: new Date()
      }]);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Load error:", error);
      alert(locale === "tr" ? "Site yüklenemedi" : "Failed to load website");
      router.push(`/${locale}/dashboard`);
    }
  };

  const addToHistory = (newHtml: string) => {
    // Remove any future history if we're not at the end
    const newHistory = htmlHistory.slice(0, historyIndex + 1);
    newHistory.push(newHtml);
    
    // Keep only last 20 versions to avoid memory issues
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHtmlHistory(newHistory);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setHtmlContent(htmlHistory[newIndex]);
      console.log('⬅️ Undo to version', newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < htmlHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setHtmlContent(htmlHistory[newIndex]);
      console.log('➡️ Redo to version', newIndex);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAIProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsAIProcessing(true);

    try {
      // Call AI API to modify website
      console.log('🔵 Sending AI edit request...', {
        websiteId,
        userPrompt: userMessage.content,
        currentHtmlLength: htmlContent.length
      });
      
      const response = await fetch('/api/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          currentHtml: htmlContent,
          userPrompt: userMessage.content,
          conversationHistory: messages,
          locale
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();
      
      console.log('✅ Data received:', {
        hasHtml: !!data.html,
        htmlLength: data.html?.length,
        explanation: data.explanation
      });

      // Update HTML content
      console.log('🔄 Updating HTML content...');
      setHtmlContent(data.html);
      addToHistory(data.html); // Add to history for undo
      console.log('✅ HTML content updated, new length:', data.html.length);

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.explanation || (locale === 'tr' 
          ? '✅ Değişiklikler uygulandı!' 
          : '✅ Changes applied!'),
        timestamp: new Date()
      };

      console.log('💬 Adding AI message:', aiMessage.content);
      setMessages(prev => {
        const updated = [...prev, aiMessage];
        console.log('📊 Messages updated, total count:', updated.length);
        return updated;
      });

      // Auto-save after AI edit
      console.log('💾 Auto-saving...');
      await handleSave(true);
      console.log('✅ All done!');

    } catch (error) {
      console.error('❌ AI edit error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: locale === 'tr' 
          ? '❌ Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.' 
          : '❌ Sorry, an error occurred. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSave = async (silent = false) => {
    setIsSaving(true);
    try {
      const { createBrowserClient } = await import("@/utils/supabase/client");
      const supabase = createBrowserClient();

      const { error } = await supabase
        .from("websites")
        .update({ 
          html_content: htmlContent,
          updated_at: new Date().toISOString()
        })
        .eq("id", websiteId);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!silent) {
        alert(locale === "tr" ? "✅ Kaydedildi!" : "✅ Saved!");
      }
      
      // Don't reload website data - it would override our current htmlContent!
      console.log('✅ Saved successfully without reloading');
      
    } catch (error) {
      console.error("Save error:", error);
      if (!silent) {
        alert(locale === "tr" ? "Kaydetme hatası" : "Save failed");
      }
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
    // This function is now replaced by chat interface
    const message = locale === "tr"
      ? `${sectionName} bölümünü değiştir: ${prompt}`
      : `Change ${sectionName} section: ${prompt}`;
    setInputMessage(message);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">
            {locale === "tr" ? "Yükleniyor..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col">
      {/* Compact Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 px-8 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">
                {website?.name}
              </h1>
              <p className="text-xs text-slate-400">
                {locale === "tr" ? "AI ile Düzenle" : "Edit with AI"}
              </p>
            </div>
            {/* Status Badge */}
            {website?.status === 'active' ? (
              <span className="px-3 py-1.5 bg-green-500/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-green-500/30">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                {locale === "tr" ? "Yayında" : "Live"}
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-slate-700/90 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                {locale === "tr" ? "Taslak" : "Draft"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Undo/Redo Buttons */}
            <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-700/50"
                title={locale === "tr" ? "Geri Al (Ctrl+Z)" : "Undo (Ctrl+Z)"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="hidden sm:inline">{locale === "tr" ? "Geri" : "Undo"}</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= htmlHistory.length - 1}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-700/50"
                title={locale === "tr" ? "İleri Al (Ctrl+Y)" : "Redo (Ctrl+Y)"}
              >
                <span className="hidden sm:inline">{locale === "tr" ? "İleri" : "Redo"}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {locale === "tr" ? "Kaydet" : "Save"}
                </>
              )}
            </button>
            {website?.status === 'draft' ? (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
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
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {locale === "tr" ? "Yayınla" : "Publish"}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleUnpublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
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
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {locale === "tr" ? "Taslağa Al" : "Unpublish"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - ChatGPT Style */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1800px] mx-auto px-8 py-6 grid grid-cols-2 gap-6">
          
          {/* Left: Chat Interface */}
          <div className="flex flex-col bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            {/* Chat Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
            >
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700/50 text-slate-100'
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
              
              {isAIProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={locale === 'tr' ? 'Sitenizde ne değiştirmek istersiniz?' : 'What would you like to change?'}
                  className="flex-1 bg-slate-700/50 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 scrollbar-thin scrollbar-thumb-slate-600"
                  rows={3}
                  disabled={isAIProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isAIProcessing}
                  className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAIProcessing ? (
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
              <p className="text-xs text-slate-500 mt-2">
                {locale === 'tr' ? 'Enter ile gönder, Shift+Enter ile yeni satır' : 'Press Enter to send, Shift+Enter for new line'}
              </p>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="flex flex-col bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-400 ml-2">{locale === 'tr' ? 'Canlı Önizleme' : 'Live Preview'}</span>
              </div>
              <button
                onClick={() => {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.open();
                    win.document.write(htmlContent);
                    win.document.close();
                  }
                }}
                className="text-xs px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {locale === 'tr' ? 'Tam Ekran' : 'Full Screen'}
              </button>
            </div>
            <div className="flex-1 bg-white overflow-hidden">
              <iframe
                key={htmlContent.substring(0, 100)} // Force re-render when HTML changes
                srcDoc={htmlContent}
                className="w-full h-full"
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
