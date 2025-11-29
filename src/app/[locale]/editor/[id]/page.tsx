"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { retryFetch, getErrorMessage } from "@/utils/retry";
import { saveConversation, loadConversation } from "@/utils/conversation-storage";
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'preview'>('chat');

  // History management for undo/redo
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLongRunning, setIsLongRunning] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldSkipInitialScroll = useRef(true);

  const supabase = useSupabaseClient();
  const [session, setSession] = useState<any>(null);

  // Load session
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, [supabase]);

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

  // Load conversation when Editor opens
  useEffect(() => {
    if (websiteId && supabase && session && website && website.id === websiteId) {
      loadConversation(websiteId, supabase).then(savedMessages => {
        if (savedMessages.length > 0) {
          console.log(`📝 Loaded ${savedMessages.length} messages from conversation`);
          setMessages(savedMessages);
        } else {
          // No history, show welcome message
          setMessages([{
            role: 'assistant',
            content: locale === 'tr'
              ? `Merhaba! "${website.name}" sitenizi düzenlemeye hazırım. Ne yapmak istersiniz?\n\nÖrnek:\n- "Renkleri daha modern yap"\n- "Hero bölümünü daha çekici hale getir"\n- "İletişim formunu ekle"`
              : `Hello! I'm ready to edit your "${website.name}" website. What would you like to do?\n\nExamples:\n- "Make colors more modern"\n- "Make hero section more attractive"\n- "Add contact form"`,
            timestamp: new Date()
          }]);
        }
      });
    }
  }, [websiteId, supabase, session, website]);

  // Auto-save conversation (debounced 3 seconds)
  useEffect(() => {
    if (messages.length > 0 && websiteId && supabase && session?.user?.id) {
      const timer = setTimeout(() => {
        saveConversation(websiteId, session.user.id, messages, supabase);
      }, 3000); // 3 second debounce

      return () => clearTimeout(timer);
    }
  }, [messages, websiteId, supabase, session]);

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

      setIsLoading(false);

      setIsLoading(false);
    } catch (error) {
      console.error("Load error:", error);
      toast.error(locale === "tr" ? "Site yüklenemedi" : "Failed to load website");
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
    setHasUnsavedChanges(true);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setHtmlContent(htmlHistory[newIndex]);
      setHasUnsavedChanges(true);
      console.log('⬅️ Undo to version', newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < htmlHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setHtmlContent(htmlHistory[newIndex]);
      setHasUnsavedChanges(true);
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
    setRetryCount(0);
    setIsLongRunning(false);

    // Show "taking longer than usual" message after 20 seconds
    const longRunningTimer = setTimeout(() => {
      setIsLongRunning(true);
    }, 20000);

    try {
      // Call AI API to modify website
      console.log('🔵 Sending AI edit request...', {
        websiteId,
        userPrompt: userMessage.content,
        currentHtmlLength: htmlContent.length
      });

      const response = await retryFetch(
        '/api/ai-edit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            websiteId,
            currentHtml: htmlContent,
            userPrompt: userMessage.content,
            conversationHistory: messages,
            locale
          })
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          timeoutMs: 60000,
          onRetry: (attempt, error) => {
            setRetryCount(attempt);
            console.log(`Retry attempt ${attempt}:`, error.message);
          },
        }
      );

      clearTimeout(longRunningTimer);
      setIsLongRunning(false);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.error || 'AI request failed');
        error.status = response.status;
        throw error;
      }

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
        timestamp: new Date(),
        tokenUsage: data.tokenUsage
      };

      console.log('💬 Adding AI message:', aiMessage.content);
      setMessages(prev => {
        const updated = [...prev, aiMessage];
        console.log('📊 Messages updated, total count:', updated.length);
        return updated;
      });

      // Auto-save removed to allow manual save
      // await handleSave(true);
      console.log('✅ All done!');

    } catch (error) {
      clearTimeout(longRunningTimer);
      setIsLongRunning(false);

      console.error('❌ AI edit error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: getErrorMessage(error, locale as 'tr' | 'en'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAIProcessing(false);
      setRetryCount(0);
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
        toast.success(locale === "tr" ? "Kaydedildi!" : "Saved!");
      }

      // Don't reload website data - it would override our current htmlContent!
      console.log('✅ Saved successfully without reloading');
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error("Save error:", error);
      if (!silent) {
        toast.error(locale === "tr" ? "Kaydetme hatası" : "Save failed");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    toast.promise(
      (async () => {
        const { createBrowserClient } = await import("@/utils/supabase/client");
        const supabase = createBrowserClient();

        const { error } = await supabase
          .from("websites")
          .update({ status: "active" })
          .eq("id", websiteId);

        if (error) throw error;
        await loadWebsite();
      })(),
      {
        loading: locale === "tr" ? "Yayınlanıyor..." : "Publishing...",
        success: locale === "tr" ? "Site yayında!" : "Site is now live!",
        error: locale === "tr" ? "Yayınlama hatası" : "Publish failed",
      }
    );
  };

  const handleUnpublish = async () => {
    toast.promise(
      (async () => {
        const { createBrowserClient } = await import("@/utils/supabase/client");
        const supabase = createBrowserClient();

        const { error } = await supabase
          .from("websites")
          .update({ status: "draft" })
          .eq("id", websiteId);

        if (error) throw error;
        await loadWebsite();
      })(),
      {
        loading: locale === "tr" ? "İşleniyor..." : "Processing...",
        success: locale === "tr" ? "Site taslağa alındı" : "Site moved to draft",
        error: locale === "tr" ? "Yayından kaldırma hatası" : "Unpublish failed",
      }
    );
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
      <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            {locale === "tr" ? "Yükleniyor..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden flex flex-col">
      {/* Compact Header */}
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-slate-700/50 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">
                {website?.name}
              </h1>
              <p className="hidden sm:block text-xs text-gray-500 dark:text-slate-400">
                {locale === "tr" ? "AI ile Düzenle" : "Edit with AI"}
              </p>
            </div>
            {/* Status Badge - Hidden on very small screens */}
            <div className="hidden sm:block">
              {website?.status === 'active' ? (
                <span className="px-3 py-1.5 bg-green-500/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-green-500/30">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  {locale === "tr" ? "Yayında" : "Live"}
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-gray-200/90 dark:bg-slate-700/90 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-slate-400 rounded-full"></span>
                  {locale === "tr" ? "Taslak" : "Draft"}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Undo/Redo Buttons - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 border-r border-gray-200 dark:border-slate-700 pr-3">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-slate-700/50"
                title={locale === "tr" ? "Geri Al (Ctrl+Z)" : "Undo (Ctrl+Z)"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="hidden lg:inline">{locale === "tr" ? "Geri" : "Undo"}</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= htmlHistory.length - 1}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-slate-700/50"
                title={locale === "tr" ? "İleri Al (Ctrl+Y)" : "Redo (Ctrl+Y)"}
              >
                <span className="hidden lg:inline">{locale === "tr" ? "İleri" : "Redo"}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || !hasUnsavedChanges}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="hidden sm:inline">{locale === "tr" ? "Kaydediliyor..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span className="hidden sm:inline">{locale === "tr" ? "Kaydet" : "Save"}</span>
                </>
              )}
            </button>
            {website?.status === 'draft' ? (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">{locale === "tr" ? "Yayınlanıyor..." : "Publishing..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline">{locale === "tr" ? "Yayınla" : "Publish"}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleUnpublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">{locale === "tr" ? "İşleniyor..." : "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="hidden sm:inline">{locale === "tr" ? "Taslağa Al" : "Unpublish"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-2">
        <div className="flex p-1 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
          <button
            onClick={() => setActiveMobileTab('chat')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeMobileTab === 'chat'
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
          >
            {locale === "tr" ? "Sohbet" : "Chat"}
          </button>
          <button
            onClick={() => setActiveMobileTab('preview')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeMobileTab === 'preview'
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
          >
            {locale === "tr" ? "Önizleme" : "Preview"}
          </button>
        </div>
      </div>

      {/* Main Content - ChatGPT Style */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Chat Interface */}
          <div className={`${activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'} flex-col bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden shadow-xl dark:shadow-none h-full`}>
            {/* Chat Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-60">
                            {message.timestamp.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {message.tokenUsage && (
                            <p className="text-[10px] opacity-50 flex items-center gap-1" title={locale === 'tr' ? 'Token Kullanımı' : 'Token Usage'}>
                              <span>🔢 {message.tokenUsage.totalTokens}</span>
                              <span className="hidden group-hover:inline">
                                (In: {message.tokenUsage.inputTokens}, Out: {message.tokenUsage.outputTokens})
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isAIProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-slate-700/50">
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-transparent">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={locale === 'tr' ? 'Sitenizde ne değiştirmek istersiniz?' : 'What would you like to change?'}
                  className="flex-1 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 border border-gray-200 dark:border-transparent shadow-sm dark:shadow-none"
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
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                {locale === 'tr' ? 'Enter ile gönder, Shift+Enter ile yeni satır' : 'Press Enter to send, Shift+Enter for new line'}
              </p>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className={`${activeMobileTab === 'preview' ? 'flex' : 'hidden lg:flex'} flex-col bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden shadow-xl dark:shadow-none h-full`}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 flex items-center justify-between bg-gray-50 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-500 dark:text-slate-400 ml-2">{locale === 'tr' ? 'Canlı Önizleme' : 'Live Preview'}</span>
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
                className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {locale === 'tr' ? 'Tam Ekran' : 'Full Screen'}
              </button>
            </div>
            <div className="relative flex-1 bg-white overflow-hidden">
              {isAIProcessing && (
                <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300 animate-pulse">
                      {locale === "tr" ? "Site güncelleniyor..." : "Updating website..."}
                    </p>
                  </div>
                </div>
              )}
              <iframe
                key={htmlContent.substring(0, 100)} // Force re-render when HTML changes
                srcDoc={htmlContent + `
                  <script>
                    document.addEventListener('click', function(e) {
                      if (e.target.closest('a')) {
                        e.preventDefault();
                        console.log('Navigation prevented in preview');
                      }
                    }, true);
                    document.addEventListener('submit', function(e) {
                      e.preventDefault();
                      console.log('Form submission prevented in preview');
                    }, true);
                  </script>
                `}
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
