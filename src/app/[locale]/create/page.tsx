"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { TemplateData, ServiceItem, TestimonialItem } from "@/types/template";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type WizardStep = "template" | "business" | "content" | "ai-generate" | "preview";

type ThemeOption = {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  features: string[];
};

// Tüm tema klasörlerini otomatik olarak oku
const themeFolders = [
  "business-modern",
  "portfolio-creative",
  "agency-modern",
  "landing-startup",
  "blog-minimal",
  "personal-cv",
  // "saas-modern",
  // "restaurant-elegant",
  // "portfolio-minimal",
  // "corporate-classic",
  // "ecommerce-simple",
  // "event-landing",
  // "startup-tech",
];

function getThemeData(locale: string): ThemeOption[] {
  // Return hardcoded theme data since require() doesn't work in Next.js App Router
  const themes: ThemeOption[] = [
    {
      id: "business-modern",
      name: locale === 'tr' ? "Modern İşletme" : "Business Modern",
      description: locale === 'tr' ? "Profesyonel ve modern işletme sitesi" : "Professional and modern business website",
      category: "business",
      preview: `/templates/business-modern/preview.html`,
      features: ["Responsive", "Modern", "Professional"],
    },
    {
      id: "portfolio-creative",
      name: locale === 'tr' ? "Yaratıcı Portfolyo" : "Creative Portfolio",
      description: locale === 'tr' ? "Yaratıcı profesyoneller için portfolyo" : "Portfolio for creative professionals",
      category: "portfolio",
      preview: `/templates/portfolio-creative/preview.html`,
      features: ["Creative", "Showcase", "Modern"],
    },
    {
      id: "agency-modern",
      name: locale === 'tr' ? "Modern Ajans" : "Modern Agency",
      description: locale === 'tr' ? "Dijital ajanslar için modern tasarım" : "Modern design for digital agencies",
      category: "agency",
      preview: `/templates/agency-modern/preview.html`,
      features: ["Professional", "Clean", "Modern"],
    },
    {
      id: "landing-startup",
      name: locale === 'tr' ? "Startup Landing" : "Startup Landing",
      description: locale === 'tr' ? "Startup'lar için landing page" : "Landing page for startups",
      category: "landing",
      preview: `/templates/landing-startup/preview.html`,
      features: ["Conversion", "Modern", "Fast"],
    },
    {
      id: "blog-minimal",
      name: locale === 'tr' ? "Minimal Blog" : "Minimal Blog",
      description: locale === 'tr' ? "Sade ve şık blog tasarımı" : "Clean and elegant blog design",
      category: "blog",
      preview: `/templates/blog-minimal/preview.html`,
      features: ["Minimal", "Readable", "Clean"],
    },
    {
      id: "personal-cv",
      name: locale === 'tr' ? "Kişisel CV" : "Personal CV",
      description: locale === 'tr' ? "Profesyonel CV ve özgeçmiş sitesi" : "Professional CV and resume website",
      category: "personal",
      preview: `/templates/personal-cv/preview.html`,
      features: ["Professional", "Clean", "Simple"],
    },
  ];
  
  return themes.filter(theme => themeFolders.includes(theme.id));
}

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CreateProjectPage() {
  const router = useRouter();
  const locale = useLocale();

  const [currentStep, setCurrentStep] = useState<WizardStep>("template");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // AI & Preview States
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  
  // Dinamik temaları al
  const themeData = getThemeData(locale);
  
  // Debug: Log theme data
  React.useEffect(() => {
    console.log('📊 Loaded themes:', themeData.length);
    themeData.forEach(theme => {
      console.log(`  - ${theme.name}: ${theme.preview}`);
    });
  }, [themeData]);
  
  // Template Data State
  const [templateData, setTemplateData] = useState<Partial<TemplateData>>({
    businessName: "",
    industry: "",
    targetAudience: "",
    heroTitle: "",
    heroSubtitle: "",
    heroCtaText: locale === "tr" ? "İletişime Geçin" : "Get Started",
    aboutTitle: locale === "tr" ? "Hakkımızda" : "About Us",
    aboutContent: "",
    services: [],
    testimonials: [],
    ctaTitle: locale === "tr" ? "Başlamaya Hazır mısınız?" : "Ready to Get Started?",
    ctaSubtitle: locale === "tr" ? "Projeniz hakkında konuşalım" : "Let's discuss your project",
    ctaButtonText: locale === "tr" ? "Teklif Alın" : "Get a Quote",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    colorPrimary: "#0d47a1",
    colorSecondary: "#1976d2",
    colorAccent: "#ffc107",
    colorText: "#333333",
    colorBackground: "#f4f7f9",
    footerTagline: "",
    footerCopyright: `© ${new Date().getFullYear()} ${locale === "tr" ? "Tüm hakları saklıdır" : "All rights reserved"}`,
    locale: locale,
    createdAt: new Date().toISOString(),
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const updateTemplateData = <Key extends keyof TemplateData>(
    key: Key,
    value: TemplateData[Key]
  ) => {
    setHasInteracted(true);
    setTemplateData((prev: Partial<TemplateData>) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addService = () => {
    setTemplateData((prev: Partial<TemplateData>) => ({
      ...prev,
      services: [...(prev.services || []), { title: "", description: "", icon: "" }]
    }));
  };

  const removeService = (index: number) => {
    setTemplateData((prev: Partial<TemplateData>) => ({
      ...prev,
      services: (prev.services || []).filter((_: ServiceItem, i: number) => i !== index)
    }));
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    setTemplateData((prev: Partial<TemplateData>) => ({
      ...prev,
      services: (prev.services || []).map((service: ServiceItem, i: number) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const addTestimonial = () => {
    setTemplateData((prev: Partial<TemplateData>) => ({
      ...prev,
      testimonials: [...(prev.testimonials || []), { name: "", role: "", company: "", content: "" }]
    }));
  };

  const removeTestimonial = (index: number) => {
    setTemplateData((prev: Partial<TemplateData>) => ({
      ...prev,
      testimonials: (prev.testimonials || []).filter((_: TestimonialItem, i: number) => i !== index)
    }));
  };

  const updateTestimonial = (index: number, field: keyof TestimonialItem, value: string) => {
    setTemplateData((prev: Partial<TemplateData>) => ({
      ...prev,
      testimonials: (prev.testimonials || []).map((testimonial: TestimonialItem, i: number) => 
        i === index ? { ...testimonial, [field]: value } : testimonial
      )
    }));
  };

  const selectedTheme = themeData.find((t) => t.id === selectedTemplate);

  const handleNext = () => {
    if (currentStep === "template") {
      if (!selectedTemplate) {
        setHasInteracted(true);
        return;
      }
      setCurrentStep("business");
    } else if (currentStep === "business") {
      if (!templateData.businessName || !templateData.industry) {
        setHasInteracted(true);
        return;
      }
      setCurrentStep("content");
    } else if (currentStep === "content") {
      if (!templateData.heroTitle || !templateData.aboutContent) {
        setHasInteracted(true);
        return;
      }
      setCurrentStep("ai-generate");
    } else if (currentStep === "ai-generate") {
      // Generate will be handled by the generate button
      setCurrentStep("preview");
    }
  };

  const handleBack = () => {
    if (currentStep === "business") {
      setCurrentStep("template");
    } else if (currentStep === "content") {
      setCurrentStep("business");
    } else if (currentStep === "ai-generate") {
      setCurrentStep("content");
    } else if (currentStep === "preview") {
      setCurrentStep("ai-generate");
    }
  };

  // AI Generation Handler with Claude
  const handleAIGenerate = async (isRefinement = false) => {
    setIsGenerating(true);
    
    try {
      const prompt = isRefinement ? refinementPrompt : aiPrompt;
      
      // Step 1: Generate content with Claude
      const contentResponse = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: templateData.businessName,
          businessType: templateData.industry || "",
          description: prompt || templateData.aboutContent || "",
          services: templateData.services || [],
          testimonials: templateData.testimonials || [],
          template: selectedTemplate,
          locale: locale,
        }),
      });

      if (!contentResponse.ok) {
        const error = await contentResponse.json();
        throw new Error(error.details || "Content generation failed");
      }

      const contentResult = await contentResponse.json();
      console.log("✅ Claude generated content:", contentResult);
      
      // Step 2: Merge content into template
      const mergeResponse = await fetch("/api/merge-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          content: contentResult.content,
          locale: locale,
        }),
      });

      if (!mergeResponse.ok) {
        throw new Error("Template merge failed");
      }

      const mergeResult = await mergeResponse.json();
      setGeneratedHtml(mergeResult.html);
      setGenerationHistory(prev => [...prev, mergeResult.html]);
      
      if (!isRefinement) {
        setCurrentStep("preview");
      } else {
        setRefinementPrompt("");
      }
      
    } catch (error: any) {
      console.error("AI generation error:", error);
      alert(locale === "tr" 
        ? `AI ile içerik oluşturulurken hata oluştu:\n${error.message}` 
        : `Error generating content with AI:\n${error.message}`);

    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTemplate || !templateData.businessName || !generatedHtml) {
      setHasInteracted(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Deploy the generated website
      const response = await fetch("/api/deploy-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generatedHtml: generatedHtml,
          templateData: templateData,
          templateId: selectedTemplate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success message
        alert(locale === "tr" 
          ? `🎉 Web siteniz yayınlandı!\n\nURL: ${result.deploymentUrl}\n\nDashboard'a yönlendiriliyorsunuz...` 
          : `🎉 Your website is live!\n\nURL: ${result.deploymentUrl}\n\nRedirecting to dashboard...`);
        
        // Redirect to dashboard with deployment info
        router.push(`/${locale}/dashboard?deployed=${result.deploymentId}`);
      } else {
        throw new Error("Failed to deploy website");
      }
    } catch (error) {
      console.error("Deployment error:", error);
      alert(locale === "tr" 
        ? "Website yayınlanırken hata oluştu. Lütfen tekrar deneyin." 
        : "Error deploying website. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Array<{ id: WizardStep; label: string; icon: string }> = [
    { id: "template", label: locale === "tr" ? "Şablon" : "Template", icon: "🎨" },
    { id: "business", label: locale === "tr" ? "İşletme" : "Business", icon: "🏢" },
    { id: "content", label: locale === "tr" ? "İçerik" : "Content", icon: "📝" },
    { id: "ai-generate", label: locale === "tr" ? "AI Üret" : "AI Generate", icon: "🤖" },
    { id: "preview", label: locale === "tr" ? "Önizleme" : "Preview", icon: "👀" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      {/* Header with Progress */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                    disabled={idx > currentStepIndex}
                    className={cls(
                      "flex items-center gap-2 transition-all duration-300",
                      idx <= currentStepIndex ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className={cls(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      idx === currentStepIndex
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
                        : idx < currentStepIndex
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    )}>
                      {idx < currentStepIndex ? "✓" : idx + 1}
                    </div>
                    <span className={cls(
                      "hidden sm:inline text-sm font-medium",
                      idx === currentStepIndex ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={cls(
                      "h-0.5 w-8 transition-all",
                      idx < currentStepIndex ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {locale === "tr" ? "İptal" : "Cancel"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          
          {/* Step 1: Template Selection */}
          {currentStep === "template" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === "tr" ? "Şablon Seçin" : "Choose a Template"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {locale === "tr" 
                    ? "İşletmeniz için en uygun şablonu seçin" 
                    : "Select the perfect template for your business"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themeData.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTemplate(theme.id)}
                    className={cls(
                      "relative group border-2 rounded-xl p-4 text-left transition-all duration-300 hover:shadow-lg",
                      selectedTemplate === theme.id
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                    )}
                  >
                    {/* Preview Image */}
                    <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg mb-3 overflow-hidden flex items-center justify-center relative">
                      <img 
                        src={theme.preview} 
                        alt={theme.name}
                        className="w-full h-full object-cover absolute inset-0"
                        loading="lazy"
                      />
                      {/* Fallback placeholder - shown if image fails */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-[img:error]:opacity-100 transition-opacity">
                        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    {/* Theme Info */}
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{theme.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{theme.description}</p>

                    {/* Features */}
                    {theme.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {theme.features.slice(0, 3).map((feature, idx) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Selected Indicator */}
                    {selectedTemplate === theme.id && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {!selectedTemplate && hasInteracted && (
                <p className="text-center text-sm text-red-600 dark:text-red-400">
                  {locale === "tr" ? "Lütfen bir şablon seçin" : "Please select a template"}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Business Info */}
          {currentStep === "business" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === "tr" ? "İşletme Bilgileri" : "Business Information"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {locale === "tr" 
                    ? "İşletmeniz hakkında temel bilgileri girin" 
                    : "Tell us about your business"}
                </p>
              </div>

              <div className="space-y-4">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {locale === "tr" ? "İşletme Adı" : "Business Name"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateData.businessName || ""}
                    onChange={(e) => updateTemplateData("businessName", e.target.value)}
                    placeholder={locale === "tr" ? "örn. TechCorp Solutions" : "e.g. TechCorp Solutions"}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                  {!templateData.businessName && hasInteracted && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {locale === "tr" ? "Lütfen işletme adını girin" : "Please enter business name"}
                    </p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {locale === "tr" ? "Sektör" : "Industry"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateData.industry || ""}
                    onChange={(e) => updateTemplateData("industry", e.target.value)}
                    placeholder={locale === "tr" ? "örn. Teknoloji Danışmanlığı" : "e.g. Technology Consulting"}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                  {!templateData.industry && hasInteracted && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {locale === "tr" ? "Lütfen sektörü girin" : "Please enter industry"}
                    </p>
                  )}
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {locale === "tr" ? "Hedef Kitle" : "Target Audience"}
                  </label>
                  <textarea
                    value={templateData.targetAudience || ""}
                    onChange={(e) => updateTemplateData("targetAudience", e.target.value)}
                    placeholder={locale === "tr" ? "örn. Kurumsal işletmeler" : "e.g. Enterprise businesses"}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      {locale === "tr" ? "E-posta" : "Email"}
                    </label>
                    <input
                      type="email"
                      value={templateData.contactEmail || ""}
                      onChange={(e) => updateTemplateData("contactEmail", e.target.value)}
                      placeholder="contact@example.com"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      {locale === "tr" ? "Telefon" : "Phone"}
                    </label>
                    <input
                      type="tel"
                      value={templateData.contactPhone || ""}
                      onChange={(e) => updateTemplateData("contactPhone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {locale === "tr" ? "Adres" : "Address"}
                  </label>
                  <input
                    type="text"
                    value={templateData.contactAddress || ""}
                    onChange={(e) => updateTemplateData("contactAddress", e.target.value)}
                    placeholder={locale === "tr" ? "İstanbul, Türkiye" : "San Francisco, CA"}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Content */}
          {currentStep === "content" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {locale === "tr" ? "İçerik Bilgileri" : "Content Information"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {locale === "tr" 
                    ? "Web sitenizin içeriğini oluşturun" 
                    : "Create your website content"}
                </p>
              </div>

              <div className="space-y-6">
                {/* Hero Section */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                    {locale === "tr" ? "Ana Başlık (Hero)" : "Hero Section"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {locale === "tr" ? "Başlık" : "Title"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={templateData.heroTitle || ""}
                        onChange={(e) => updateTemplateData("heroTitle", e.target.value)}
                        placeholder={locale === "tr" ? "örn. İşinizi AI ile Dönüştürün" : "e.g. Transform Your Business with AI"}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {locale === "tr" ? "Alt Başlık" : "Subtitle"}
                      </label>
                      <input
                        type="text"
                        value={templateData.heroSubtitle || ""}
                        onChange={(e) => updateTemplateData("heroSubtitle", e.target.value)}
                        placeholder={locale === "tr" ? "Kısa açıklama" : "Brief description"}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {locale === "tr" ? "Buton Metni" : "Button Text"}
                      </label>
                      <input
                        type="text"
                        value={templateData.heroCtaText || ""}
                        onChange={(e) => updateTemplateData("heroCtaText", e.target.value)}
                        placeholder={locale === "tr" ? "örn. Başlayın" : "e.g. Get Started"}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                    {locale === "tr" ? "Hakkımızda" : "About Section"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {locale === "tr" ? "Başlık" : "Title"}
                      </label>
                      <input
                        type="text"
                        value={templateData.aboutTitle || ""}
                        onChange={(e) => updateTemplateData("aboutTitle", e.target.value)}
                        placeholder={locale === "tr" ? "Hakkımızda" : "About Us"}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        {locale === "tr" ? "İçerik" : "Content"} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={templateData.aboutContent || ""}
                        onChange={(e) => updateTemplateData("aboutContent", e.target.value)}
                        placeholder={locale === "tr" ? "İşletmeniz hakkında detaylı bilgi..." : "Tell your story..."}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {locale === "tr" ? "Hizmetler" : "Services"}
                    </h3>
                    <button
                      type="button"
                      onClick={addService}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      + {locale === "tr" ? "Ekle" : "Add"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(templateData.services || []).map((service: ServiceItem, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={service.title}
                              onChange={(e) => updateService(index, "title", e.target.value)}
                              placeholder={locale === "tr" ? "Hizmet adı" : "Service name"}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 text-sm"
                            />
                            <textarea
                              value={service.description}
                              onChange={(e) => updateService(index, "description", e.target.value)}
                              placeholder={locale === "tr" ? "Açıklama" : "Description"}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeService(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonials */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {locale === "tr" ? "Referanslar" : "Testimonials"}
                    </h3>
                    <button
                      type="button"
                      onClick={addTestimonial}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      + {locale === "tr" ? "Ekle" : "Add"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(templateData.testimonials || []).map((testimonial: TestimonialItem, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={testimonial.name}
                                onChange={(e) => updateTestimonial(index, "name", e.target.value)}
                                placeholder={locale === "tr" ? "İsim" : "Name"}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 text-sm"
                              />
                              <input
                                type="text"
                                value={testimonial.role}
                                onChange={(e) => updateTestimonial(index, "role", e.target.value)}
                                placeholder={locale === "tr" ? "Ünvan" : "Role"}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 text-sm"
                              />
                            </div>
                            <input
                              type="text"
                              value={testimonial.company}
                              onChange={(e) => updateTestimonial(index, "company", e.target.value)}
                              placeholder={locale === "tr" ? "Şirket" : "Company"}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 text-sm"
                            />
                            <textarea
                              value={testimonial.content}
                              onChange={(e) => updateTestimonial(index, "content", e.target.value)}
                              placeholder={locale === "tr" ? "Yorum" : "Comment"}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTestimonial(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: AI Generate */}
          {currentStep === "ai-generate" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🤖 {locale === "tr" ? "AI ile İçerik Oluştur" : "Generate Content with AI"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {locale === "tr" 
                    ? "Yapay zeka sitenizin içeriğini oluşturacak. İstediğiniz değişiklikleri açıklayın." 
                    : "AI will generate your website content. Describe any specific requirements."}
                </p>
              </div>

              {/* Özet ve Tema Önizlemesi - Tek Satırda */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Özet */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">
                    {locale === "tr" ? "📋 Özet" : "📋 Summary"}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏢</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                          {templateData.businessName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{templateData.industry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>📝</span>
                      <span>{(templateData.services || []).length} {locale === "tr" ? "hizmet" : "services"}</span>
                      <span>•</span>
                      <span>{(templateData.testimonials || []).length} {locale === "tr" ? "referans" : "testimonials"}</span>
                    </div>
                  </div>
                </div>

                {/* Seçili Tema */}
                {selectedTheme && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white">
                      {locale === "tr" ? "🎨 Seçili Şablon" : "🎨 Selected Template"}
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="relative w-24 h-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <img
                            src={selectedTheme.preview}
                            alt={selectedTheme.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                                    <div class="text-2xl">🎨</div>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {selectedTheme.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Prompt */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                  {locale === "tr" ? "AI'a Talimatlar (Opsiyonel)" : "Instructions for AI (Optional)"}
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={locale === "tr" 
                    ? "Örnek: 'Profesyonel ve modern bir ton kullan. Teknoloji odaklı şirketimiz için etkileyici bir hero başlığı oluştur. Hizmetlerimizi açık ve net bir şekilde anlat...'"
                    : "Example: 'Use a professional and modern tone. Create an impressive hero title for our tech-focused company. Describe our services clearly and concisely...'"}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none"
                />
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  💡 {locale === "tr" 
                    ? "Boş bırakırsanız, AI girdiğiniz bilgileri kullanarak otomatik olarak içerik oluşturacaktır." 
                    : "If left empty, AI will automatically generate content based on the information you provided."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAIGenerate(false)}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {locale === "tr" ? "AI İçerik Oluşturuyor..." : "AI Generating Content..."}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 7H7v6h6V7z" />
                      <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                    </svg>
                    {locale === "tr" ? "🚀 AI ile Web Sitesi Oluştur" : "🚀 Generate Website with AI"}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 6: Preview */}
          {currentStep === "preview" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  👀 {locale === "tr" ? "Canlı Önizleme" : "Live Preview"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {locale === "tr" 
                    ? "Web sitenizi önizleyin, değişiklik isteyin veya onaylayın" 
                    : "Preview your website, request changes, or approve"}
                </p>
              </div>

              {/* Preview Frame */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {templateData.businessName}.nocodepage.ai
                    </span>
                  </div>
                  <div className="flex gap-2">
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
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {locale === "tr" ? "Yeni Sekmede Aç" : "Open in New Tab"}
                    </button>
                  </div>
                </div>
                
                {/* Preview iframe */}
                <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden" style={{ height: '600px' }}>
                  {generatedHtml ? (
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full h-full border-0"
                      title="Website Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <p>{locale === "tr" ? "Önizleme yükleniyor..." : "Loading preview..."}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Refinement Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                  <span>✨</span>
                  {locale === "tr" ? "Değişiklik İste" : "Request Changes"}
                </h3>
                <textarea
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder={locale === "tr" 
                    ? "Örnek: 'Hero başlığını daha etkileyici yap, renkleri daha canlı hale getir, hizmetler bölümüne daha fazla detay ekle...'"
                    : "Example: 'Make the hero title more catchy, use brighter colors, add more details to the services section...'"}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all resize-none mb-3"
                />
                <button
                  type="button"
                  onClick={() => handleAIGenerate(true)}
                  disabled={isGenerating || !refinementPrompt.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {locale === "tr" ? "Yeniden Oluşturuluyor..." : "Regenerating..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      {locale === "tr" ? "Değişiklikleri Uygula" : "Apply Changes"}
                    </>
                  )}
                </button>
              </div>

              {/* Generation History */}
              {generationHistory.length > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm mb-2 text-gray-900 dark:text-white">
                    {locale === "tr" ? "Versiyon Geçmişi" : "Version History"}
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {generationHistory.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setGeneratedHtml(generationHistory[index])}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                      >
                        {locale === "tr" ? "Versiyon" : "Version"} {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === "template"}
              className={cls(
                "px-6 py-3 rounded-lg font-medium transition-all",
                currentStep === "template"
                  ? "invisible"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              ← {locale === "tr" ? "Geri" : "Back"}
            </button>

            {currentStep === "preview" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !generatedHtml}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {isSubmitting 
                  ? (locale === "tr" ? "Yayınlanıyor..." : "Deploying...") 
                  : (locale === "tr" ? "Onayla ve Yayınla" : "Approve & Deploy")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
              >
                {locale === "tr" ? "İleri" : "Next"} →
              </button>
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
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
