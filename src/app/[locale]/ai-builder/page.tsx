"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { retryFetch, getErrorMessage } from "@/utils/retry";
import { saveConversation, loadConversation } from "@/utils/conversation-storage";
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { toast } from 'sonner';
import PublishSettings from '@/components/dashboard/PublishSettings';

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

export default function AIBuilderPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('settings.modelDescriptions');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLongRunning, setIsLongRunning] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [websiteStatus, setWebsiteStatus] = useState<'draft' | 'published'>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Model selection - dynamic based on user's API keys
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // History management for undo/redo
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const supabase = useSupabaseClient();
  const [session, setSession] = useState<any>(null);

  // Load session
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, [supabase]);

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

  // Load conversation when websiteId exists (after save)
  useEffect(() => {
    if (websiteId && supabase && session) {
      loadConversation(websiteId, supabase).then(savedMessages => {
        if (savedMessages.length > 0) {
          console.log(`📝 Loaded ${savedMessages.length} messages from conversation`);
          setMessages(savedMessages);
        }
      });
    }
  }, [websiteId, supabase, session]);

  // Load available models based on user's API keys
  useEffect(() => {
    const loadAvailableModels = async () => {
      if (!supabase || !session) {
        setLoadingModels(false);
        return;
      }

      try {
        const response = await fetch('/api/user/available-models', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || []);

          // Set default model from localStorage or first available
          const savedModel = localStorage.getItem('selectedModel');
          if (savedModel && data.models.some((m: any) => m.id === savedModel)) {
            setSelectedModel(savedModel);
          } else if (data.models.length > 0) {
            setSelectedModel(data.models[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoadingModels(false);
      }
    };

    loadAvailableModels();
  }, [supabase, session]);

  // Save selected model to localStorage
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

  // Auto-save conversation (debounced 3 seconds)
  useEffect(() => {
    if (messages.length > 0 && websiteId && supabase && session?.user?.id) {
      const timer = setTimeout(() => {
        saveConversation(websiteId, session.user.id, messages, supabase);
      }, 3000); // 3 second debounce

      return () => clearTimeout(timer);
    }
  }, [messages, websiteId, supabase, session]);

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
    setIsLongRunning(false);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Show "taking longer than usual" message after 20 seconds
    const longRunningTimer = setTimeout(() => {
      setIsLongRunning(true);
    }, 20000);

    try {
      // Direct fetch without retry to save tokens
      const response = await fetch("/api/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inputMessage,
          model: selectedModel,
          currentHtml: generatedHtml || null,
          conversationHistory: messages,
          locale: locale,
          websiteId: websiteId,
          userId: session?.user?.id || null,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(longRunningTimer);
      setIsLongRunning(false);

      if (!response.ok) {
        const errorData = await response.json();
        const error: any = new Error(errorData.details || "Generation failed");
        error.status = response.status;
        throw error;
      }

      const result = await response.json();

      // Add to history
      const newHtml = result.html;
      setHtmlHistory(prev => {
        const newHistory = [...prev.slice(0, historyIndex + 1), newHtml];
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      setHistoryIndex(prev => prev + 1);
      setGeneratedHtml(newHtml);
      setHasUnsavedChanges(true);

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
      clearTimeout(longRunningTimer);
      setIsLongRunning(false);

      // Check if request was cancelled
      if (error.name === 'AbortError') {
        console.log('Request cancelled by user');
        const cancelMessage: Message = {
          role: 'assistant',
          content: locale === 'tr' ? '❌ İstek iptal edildi.' : '❌ Request cancelled.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, cancelMessage]);
        return;
      }

      console.error("Generation error:", error);
      const errorMessage: Message = {
        role: 'assistant',
        content: getErrorMessage(error, locale as 'tr' | 'en'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
      toast.error(locale === "tr" ? "Önce bir site oluşturun" : "Create a website first");
      return;
    }

    if (!websiteName.trim()) {
      toast.error(locale === "tr" ? "Lütfen site adı girin" : "Please enter website name");
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

      toast.success(locale === "tr"
        ? "Site kaydedildi!"
        : "Website saved!");

    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(locale === "tr"
        ? `Kaydetme hatası: ${error.message}`
        : `Save error: ${error.message}`);
    } finally {
      setIsSaving(false);
      setHasUnsavedChanges(false);
    }
  };

  const handlePublishClick = () => {
    if (!websiteId) {
      toast.error(locale === "tr" ? "Önce siteyi kaydedin" : "Save the website first");
      return;
    }
    setShowPublishModal(true);
  };

  const handlePublishSuccess = () => {
    // Refresh website status
    if (websiteId) {
      supabase?.from('websites').select('is_published').eq('id', websiteId).single()
        .then(({ data }) => {
          if (data?.is_published) {
            setWebsiteStatus('published');
          }
        });
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
      toast.success(locale === "tr"
        ? "Site yayından kaldırıldı"
        : "✅ Website unpublished");

    } catch (error: any) {
      console.error("Unpublish error:", error);
      toast.error(locale === "tr"
        ? `Hata: ${error.message}`
        : `Error: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'preview'>('chat');

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden flex flex-col">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
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
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-white/10">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
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
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Status Chip - Hidden on mobile */}
                {websiteId && (
                  <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${websiteStatus === 'published'
                    ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${websiteStatus === 'published' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {websiteStatus === 'published'
                      ? (locale === "tr" ? 'Yayında' : 'Live')
                      : (locale === "tr" ? 'Taslak' : 'Draft')}
                  </div>
                )}

                {/* Undo/Redo - Hidden on very small screens */}
                <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-slate-700/30 rounded-lg p-1 ring-1 ring-gray-200 dark:ring-white/5">
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

                {/* Site Name Input - Compact on mobile */}
                <div className="relative">
                  <input
                    type="text"
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    placeholder={locale === "tr" ? "Site adı..." : "Site name..."}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600/50 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 text-xs sm:text-sm w-28 sm:w-40 transition-all"
                  />
                </div>

                {/* Save Button - Icon only on mobile */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !generatedHtml || !hasUnsavedChanges}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
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
                  <span className="hidden sm:inline">
                    {isSaving ? (locale === "tr" ? "..." : "...") : (locale === "tr" ? "Kaydet" : "Save")}
                  </span>
                </button>

                {/* Publish Button - Hidden on mobile if not published, or icon only */}
                {websiteId && (
                  <button
                    onClick={websiteStatus === 'published' ? handleUnpublish : handlePublishClick}
                    disabled={isPublishing}
                    className={`hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${websiteStatus === 'published'
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
                    <span className="hidden lg:inline">
                      {isPublishing
                        ? "..."
                        : websiteStatus === 'published'
                          ? (locale === "tr" ? "Kaldır" : "Unpublish")
                          : (locale === "tr" ? "Yayınla" : "Publish")
                      }
                    </span>
                  </button>
                )}
              </div>
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
          {/* Left Panel - Chat */}
          <div className={`${activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'} flex-col bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden ring-1 ring-gray-200 dark:ring-white/5 shadow-xl dark:shadow-none h-full`}>
            {/* Messages */}
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
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                            {locale === "tr" ? "AI düşünüyor" : "AI is thinking"}
                          </span>
                          <div className="flex gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          </div>
                        </div>
                        {isLongRunning && (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {locale === "tr"
                              ? "⏱️ Normalden uzun sürüyor..."
                              : "⏱️ Taking longer than usual..."}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-transparent">
              {/* Model Selector */}
              {availableModels.length > 0 && (
                <div className="mb-2 relative">
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
                  >
                    <span className="text-gray-700 dark:text-slate-300 font-medium">
                      {availableModels.find(m => m.id === selectedModel)?.name || 'Select Model'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {showModelDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-slate-500">
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-100 dark:border-slate-700/50 last:border-0 ${selectedModel === model.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                {model.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                {t(model.descriptionKey)}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                {model.providerName}
                              </div>
                            </div>
                            {selectedModel === model.id && (
                              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                  onClick={isGenerating ? handleCancelGeneration : handleSendMessage}
                  disabled={!isGenerating && !inputMessage.trim()}
                  className={`px-4 ${isGenerating
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                    } text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]`}
                  title={isGenerating ? (locale === 'tr' ? 'İsteği iptal et' : 'Cancel request') : (locale === 'tr' ? 'Gönder' : 'Send')}
                >
                  {isGenerating ? (
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      {/* Spinning circle */}
                      <svg className="absolute animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {/* Stop square icon */}
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </div>
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
          <div className={`${activeMobileTab === 'preview' ? 'flex' : 'hidden lg:flex'} flex-col bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden shadow-xl dark:shadow-none h-full`}>
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
                <div className="relative flex-1 overflow-hidden bg-white">
                  {isGenerating && (
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
                    key={generatedHtml.substring(0, 100)} // Force re-render when HTML changes
                    srcDoc={generatedHtml + `
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

      {/* Publish Settings Modal */}
      {showPublishModal && websiteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <PublishSettings
              websiteId={websiteId as string}
              websiteName={websiteName}
              onClose={() => setShowPublishModal(false)}
              onPublishSuccess={handlePublishSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}