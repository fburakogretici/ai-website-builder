"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { SiteBlueprint } from "@/components/dashboard/NewProjectWizard";

type WizardStep = "basics" | "prompt" | "theme" | "review";

type ThemeOption = {
  id: string;
  name: string;
  description: string;
  gradient: string;
  accentColor: string;
};

// Tüm tema klasörlerini otomatik olarak oku
const themeFolders = [
  "agency-modern",
  "blog-minimal",
  "business-modern",
  "personal-cv",
  "portfolio-creative",
  "landing-startup",
  // "event-landing",
  // "restaurant-elegant",
  // "saas-modern",
  // "portfolio-minimal",
  // "corporate-classic",
  // "ecommerce-simple",
  // "startup-tech",
];

function getThemeData(locale: string) {
  try {
    return themeFolders.map((folder) => {
      let config;
      try {
        config = require(`../../../../public/templates/${folder}/${locale}/config.json`);
      } catch {
        config = require(`../../../../public/templates/${folder}/en/config.json`);
      }
      return {
        id: config.id,
        name: locale === 'tr' ? config.name : config.name_en || config.name,
        description: locale === 'tr' ? config.description : config.description_en || config.description,
        gradient: 'from-indigo-500 via-purple-500 to-pink-500', // İsterseniz config'e ekleyebilirsiniz
        accentColor: 'bg-indigo-600',
        folder,
      };
    });
  } catch {
    return [];
  }
}

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CreateProjectPage() {
  const router = useRouter();
  const locale = useLocale();

  const [currentStep, setCurrentStep] = useState<WizardStep>("basics");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Dinamik temaları al
  const themeData = getThemeData(locale);
  const [formState, setFormState] = useState<SiteBlueprint>({
    projectName: "",
    websiteGoal: "",
    targetAudience: "",
    aiPrompt:
      locale === "tr"
        ? "İşletmenizi, hizmetlerinizi ve hedef kitlenizi anlatın. Varsa tercih ettiğiniz ton, CTA ve içerik bölümlerini ekleyin."
        : "Describe your business, key offerings, audience, tone of voice, must-have sections, and preferred CTAs.",
    themeId: themeData.length > 0 ? themeData[0].id : "",
  });

  const updateForm = <Key extends keyof SiteBlueprint>(
    key: Key,
    value: SiteBlueprint[Key]
  ) => {
    setHasInteracted(true);
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const fieldError = (value: string) => !value && hasInteracted;

  const handleNext = () => {
    if (currentStep === "basics") {
      if (!formState.projectName || !formState.websiteGoal) {
        setHasInteracted(true);
        return;
      }
      setCurrentStep("prompt");
    } else if (currentStep === "prompt") {
      if (!formState.aiPrompt) {
        setHasInteracted(true);
        return;
      }
      setCurrentStep("theme");
    } else if (currentStep === "theme") {
      setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "prompt") {
      setCurrentStep("basics");
    } else if (currentStep === "theme") {
      setCurrentStep("prompt");
    } else if (currentStep === "review") {
      setCurrentStep("theme");
    }
  };

  const handleSubmit = async () => {
    if (!formState.projectName || !formState.websiteGoal || !formState.aiPrompt) {
      setHasInteracted(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: API call to generate website
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      router.push(`/${locale}/dashboard`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Array<{ id: WizardStep; label: string }> = [
    { id: "basics", label: locale === "tr" ? "Temel Bilgiler" : "Basics" },
    { id: "prompt", label: locale === "tr" ? "AI İstemi" : "AI Prompt" },
    { id: "theme", label: locale === "tr" ? "Tema" : "Theme" },
    { id: "review", label: locale === "tr" ? "İnceleme" : "Review" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const selectedTheme = themeData.find((t: any) => t.id === formState.themeId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Header - Professional */}
      <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Progress Steps - Premium Design */}
            <div className="flex items-center gap-3">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Sadece tamamlanan veya mevcut adımlara gidilebilir
                      if (idx <= currentStepIndex) {
                        setCurrentStep(step.id);
                      }
                    }}
                    disabled={idx > currentStepIndex}
                    className={cls(
                      "flex items-center gap-2 group transition-all duration-300",
                      idx <= currentStepIndex 
                        ? "cursor-pointer hover:scale-105" 
                        : "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cls(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 relative z-10",
                          idx <= currentStepIndex
                            ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/30"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-2 border-gray-300 dark:border-gray-700"
                        )}
                      >
                        {idx < currentStepIndex ? (
                          <svg className="w-4 h-4 animate-scaleIn" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="animate-scaleIn">{idx + 1}</span>
                        )}
                      </div>
                      {idx <= currentStepIndex && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 animate-ping opacity-20" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={cls(
                          "text-xs font-bold whitespace-nowrap transition-all duration-300",
                          idx === currentStepIndex
                            ? "text-indigo-600 dark:text-indigo-400"
                            : idx < currentStepIndex
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-400 dark:text-gray-500"
                        )}
                      >
                        {step.label}
                      </span>
                      {idx === currentStepIndex && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 animate-fadeIn">
                          {locale === "tr" ? "Şu anda" : "Current"}
                        </span>
                      )}
                    </div>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className="relative">
                      <div className={cls(
                        "h-0.5 w-8 transition-all duration-500",
                        idx < currentStepIndex
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      )}>
                        {idx < currentStepIndex && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 animate-shimmer" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cancel Button - Premium */}
            <button
              type="button"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="group relative px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg className="w-4 h-4 relative z-10 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline relative z-10">{locale === "tr" ? "İptal" : "Cancel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Premium Design */}
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-6xl w-full mx-auto">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-8">
          {/* Step 1: Basics */}
          {currentStep === "basics" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white mb-4 shadow-lg shadow-indigo-500/30">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {locale === "tr"
                    ? "Temel bilgilerle başlayalım"
                    : "Let's start with the basics"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {locale === "tr"
                    ? "Projeniz ve hedef kitleniz hakkında bilgi verin"
                    : "Tell us about your project and who it's for"}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 group">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {locale === "tr" ? "Proje Adı" : "Project Name"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      value={formState.projectName}
                      onChange={(e) => updateForm("projectName", e.target.value)}
                      placeholder={
                        locale === "tr"
                          ? "örn. Nova Pazarlama Ajansı"
                          : "e.g. Nova Marketing Agency"
                      }
                      className={cls(
                        "w-full px-4 py-3 text-base rounded-xl border-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 shadow-sm hover:shadow-md group-hover:border-gray-300 dark:group-hover:border-gray-600",
                        fieldError(formState.projectName)
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20"
                      )}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    {fieldError(formState.projectName) && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {locale === "tr"
                          ? "Lütfen bir proje adı girin"
                          : "Please enter a project name"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    {locale === "tr" ? "Web Sitesi Hedefi" : "Website Goal"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={formState.websiteGoal}
                      onChange={(e) => updateForm("websiteGoal", e.target.value)}
                      placeholder={
                        locale === "tr"
                          ? "Ne başarmak istiyorsunuz?"
                          : "What do you want to achieve?"
                      }
                      rows={4}
                      className={cls(
                        "w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 resize-none shadow-sm hover:shadow-md group-hover:border-gray-300 dark:group-hover:border-gray-600",
                        fieldError(formState.websiteGoal)
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500/20"
                      )}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    {fieldError(formState.websiteGoal) && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {locale === "tr"
                          ? "Lütfen hedefinizi açıklayın"
                          : "Please describe your goal"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {locale === "tr" ? "Hedef Kitle" : "Target Audience"} <span className="text-gray-400 text-xs font-normal">({locale === "tr" ? "Opsiyonel" : "Optional"})</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={formState.targetAudience}
                      onChange={(e) =>
                        updateForm("targetAudience", e.target.value)
                      }
                      placeholder={
                        locale === "tr"
                          ? "Kimler için yapıyorsunuz?"
                          : "Who are you building this for?"
                      }
                      rows={4}
                      className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 resize-none shadow-sm hover:shadow-md group-hover:border-gray-300 dark:group-hover:border-gray-600"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Prompt */}
          {currentStep === "prompt" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === "tr"
                    ? "Vizyonunuzu anlatın"
                    : "Describe your vision"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {locale === "tr"
                    ? "AI'ın marka sesinizi ve ihtiyaçlarınızı anlamasına yardımcı olun"
                    : "Help AI understand your brand voice and needs"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {locale === "tr" ? "AI İstemi" : "AI Prompt"}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formState.aiPrompt}
                  onChange={(e) => updateForm("aiPrompt", e.target.value)}
                  placeholder={
                    locale === "tr"
                      ? "Marka hikayenizi, tercih ettiğiniz tonu, olmazsa olmaz bölümleri ve tasarım tercihlerinizi anlatın..."
                      : "Describe your brand story, preferred tone, must-have sections, and any design preferences..."
                  }
                  rows={8}
                  className={cls(
                    "w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none",
                    fieldError(formState.aiPrompt)
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-indigo-500"
                  )}
                />
                {fieldError(formState.aiPrompt) && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {locale === "tr"
                      ? "Lütfen AI için bir istem girin"
                      : "Please provide a prompt for the AI"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Theme */}
          {currentStep === "theme" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 text-white mb-4 shadow-lg shadow-pink-500/30">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  {locale === "tr" ? "Tema Seçiniz" : "Choose Your Theme"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {locale === "tr"
                    ? "Size uygun temayı seçin"
                    : "Pick a theme that suits you"}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {themeData.map((theme: any) => {
                  const isSelected = formState.themeId === theme.id;
                  // Tema klasör adını id'den üret (örnek: business-modern, portfolio-creative vs.)
                  // id'yi dosya/folder ismine uygun şekilde eşleştirmeniz gerekebilir!
                  // Örnek eşleme:
                  const themeFolderMap: Record<string, string> = {
                    'modern-gradient': 'business-modern',
                    'minimal-light': 'portfolio-minimal',
                    'dark-elegant': 'portfolio-creative',
                    'warm-sunset': 'agency-modern',
                    'ocean-breeze': 'saas-modern',
                    'forest-green': 'restaurant-elegant',
                  };
                  const folder = themeFolderMap[theme.id] || theme.id;
                  const previewImg = `/templates/${folder}/${locale}/preview.png`;
                  const previewHtml = `/templates/${folder}/${locale}/preview.html`;
                  return (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() => updateForm("themeId", theme.id)}
                      onDoubleClick={() => window.open(previewHtml, '_blank')}
                      className={cls(
                        "group relative rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden transform hover:scale-105 hover:-translate-y-1",
                        isSelected
                          ? "border-indigo-500 shadow-2xl shadow-indigo-500/30 scale-105"
                          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-lg hover:shadow-xl"
                      )}
                    >
                      <div className="h-40 w-full relative">
                        <img
                          src={previewImg}
                          alt={theme.name + ' preview'}
                          className="object-cover object-top w-full h-full rounded-t-2xl"
                          style={{ pointerEvents: 'none' }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center animate-scaleIn">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-2xl">
                              <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative bg-white dark:bg-gray-900 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate">
                              {theme.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {theme.description}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                          )}
                        </div>
                        <div className={cls(
                          "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        )} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === "review" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === "tr"
                    ? "Oluşturmaya hazır mısınız?"
                    : "Ready to generate?"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {locale === "tr"
                    ? "Girdilerinizi gözden geçirin"
                    : "Review your inputs"}
                </p>
              </div>

              <div className="space-y-3">
                {/* Project Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                        {locale === "tr" ? "Proje" : "Project"}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {formState.projectName}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("basics")}
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100"
                    >
                      {locale === "tr" ? "Düzenle" : "Edit"}
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{locale === "tr" ? "Hedef:" : "Goal:"}</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">{formState.websiteGoal}</p>
                    </div>
                    {formState.targetAudience && (
                      <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{locale === "tr" ? "Kitle:" : "Audience:"}</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-0.5">{formState.targetAudience}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Theme Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${selectedTheme?.gradient}`} />
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">
                          {locale === "tr" ? "Tema" : "Theme"}
                        </p>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                          {selectedTheme?.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("theme")}
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100"
                    >
                      {locale === "tr" ? "Değiştir" : "Change"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation - Premium */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t-2 border-gray-200/50 dark:border-gray-700/50">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="group relative px-5 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-sm hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                disabled={isSubmitting}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg className="w-4 h-4 relative z-10 transition-transform group-hover:-translate-x-0.5 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span className="relative z-10">{locale === "tr" ? "Geri" : "Back"}</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep === "review" ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="group relative px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                disabled={isSubmitting}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {locale === "tr" ? "Oluşturuluyor..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      {locale === "tr" ? "Web Sitesi Oluştur" : "Create Website"}
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="group relative px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-2">
                  {locale === "tr" ? "Devam Et" : "Continue"}
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Premium Styles & Animations */}
      <style jsx>{`
        /* Fade In Animation */
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
          animation: fadeIn 0.4s ease-out;
        }
        
        /* Scale In Animation */
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        /* Blob Animation */
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Shimmer Animation */
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
