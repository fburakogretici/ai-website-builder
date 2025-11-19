// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useLocale } from "next-intl";
// import type { TemplateData, ServiceItem, TestimonialItem } from "@/types/template";

// type WizardStep = "template" | "business" | "content" | "styling" | "review";

// type ThemeOption = {
//   id: string;
//   name: string;
//   description: string;
//   category: string;
//   preview: string;
//   features: string[];
// };

// // Tüm tema klasörlerini otomatik olarak oku
// const themeFolders = [
//   "business-modern",
//   "agency-modern",
//   "portfolio-creative",
//   "landing-startup",
//   "saas-modern",
//   "restaurant-elegant",
//   "blog-minimal",
//   "personal-cv",
//   "portfolio-minimal",
//   "corporate-classic",
//   "ecommerce-simple",
//   "event-landing",
//   "startup-tech",
// ];

// function getThemeData(locale: string): ThemeOption[] {
//   try {
//     return themeFolders.map((folder) => {
//       let config;
//       try {
//         config = require(`../../../../public/templates/${folder}/${locale}/config.json`);
//       } catch {
//         try {
//           config = require(`../../../../public/templates/${folder}/en/config.json`);
//         } catch {
//           return null;
//         }
//       }
//       return {
//         id: config.id,
//         name: locale === 'tr' ? config.name : config.name_en || config.name,
//         description: locale === 'tr' ? config.description : config.description_en || config.description,
//         category: config.category || 'business',
//         preview: config.preview || `/templates/${folder}/preview.png`,
//         features: config.features || [],
//       };
//     }).filter(Boolean) as ThemeOption[];
//   } catch {
//     return [];
//   }
// }

// function cls(...classes: Array<string | false | null | undefined>) {
//   return classes.filter(Boolean).join(" ");
// }

// export default function CreateProjectPage() {
//   const router = useRouter();
//   const locale = useLocale();

//   const [currentStep, setCurrentStep] = useState<WizardStep>("template");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [hasInteracted, setHasInteracted] = useState(false);
  
//   // Dinamik temaları al
//   const themeData = getThemeData(locale);
  
//   // Template Data State
//   const [templateData, setTemplateData] = useState<Partial<TemplateData>>({
//     businessName: "",
//     industry: "",
//     targetAudience: "",
//     heroTitle: "",
//     heroSubtitle: "",
//     heroCtaText: locale === "tr" ? "İletişime Geçin" : "Get Started",
//     aboutTitle: locale === "tr" ? "Hakkımızda" : "About Us",
//     aboutContent: "",
//     services: [
//       { title: "", description: "", icon: "" },
//       { title: "", description: "", icon: "" },
//       { title: "", description: "", icon: "" },
//     ],
//     testimonials: [
//       { name: "", role: "", company: "", content: "" },
//       { name: "", role: "", company: "", content: "" },
//     ],
//     ctaTitle: locale === "tr" ? "Başlamaya Hazır mısınız?" : "Ready to Get Started?",
//     ctaSubtitle: locale === "tr" ? "Projeniz hakkında konuşalım" : "Let's discuss your project",
//     ctaButtonText: locale === "tr" ? "Teklif Alın" : "Get a Quote",
//     contactEmail: "",
//     contactPhone: "",
//     contactAddress: "",
//     colorPrimary: "#0d47a1",
//     colorSecondary: "#1976d2",
//     colorAccent: "#ffc107",
//     colorText: "#333333",
//     colorBackground: "#f4f7f9",
//     footerTagline: "",
//     footerCopyright: `© ${new Date().getFullYear()} ${locale === "tr" ? "Tüm hakları saklıdır" : "All rights reserved"}`,
//     locale: locale,
//     createdAt: new Date().toISOString(),
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<string>("");

//   const updateTemplateData = <Key extends keyof TemplateData>(
//     key: Key,
//     value: TemplateData[Key]
//   ) => {
//     setHasInteracted(true);
//     setTemplateData((prev: Partial<TemplateData>) => ({
//       ...prev,
//       [key]: value,
//     }));
//   };

//   const addService = () => {
//     setTemplateData((prev: Partial<TemplateData>) => ({
//       ...prev,
//       services: [...(prev.services || []), { title: "", description: "", icon: "" }]
//     }));
//   };

//   const removeService = (index: number) => {
//     setTemplateData((prev: Partial<TemplateData>) => ({
//       ...prev,
//       services: (prev.services || []).filter((_: ServiceItem, i: number) => i !== index)
//     }));
//   };

//   const updateService = (index: number, field: keyof ServiceItem, value: string) => {
//     setTemplateData((prev: Partial<TemplateData>) => ({
//       ...prev,
//       services: (prev.services || []).map((service: ServiceItem, i: number) => 
//         i === index ? { ...service, [field]: value } : service
//       )
//     }));
//   };

//   const addTestimonial = () => {
//     setTemplateData((prev: Partial<TemplateData>) => ({
//       ...prev,
//       testimonials: [...(prev.testimonials || []), { name: "", role: "", company: "", content: "" }]
//     }));
//   };

//   const removeTestimonial = (index: number) => {
//     setTemplateData((prev: Partial<TemplateData>) => ({
//       ...prev,
//       testimonials: (prev.testimonials || []).filter((_: TestimonialItem, i: number) => i !== index)
//     }));
//   };

//   const updateTestimonial = (index: number, field: keyof TestimonialItem, value: string) => {
//     setTemplateData((prev: Partial<TemplateData>) => ({
//       ...prev,
//       testimonials: (prev.testimonials || []).map((testimonial: TestimonialItem, i: number) => 
//         i === index ? { ...testimonial, [field]: value } : testimonial
//       )
//     }));
//   };

//   const selectedTheme = themeData.find((t) => t.id === selectedTemplate);

//   const handleNext = () => {
//     if (currentStep === "template") {
//       if (!selectedTemplate) {
//         setHasInteracted(true);
//         return;
//       }
//       setCurrentStep("business");
//     } else if (currentStep === "business") {
//       if (!templateData.businessName || !templateData.industry) {
//         setHasInteracted(true);
//         return;
//       }
//       setCurrentStep("content");
//     } else if (currentStep === "content") {
//       if (!templateData.heroTitle || !templateData.aboutContent) {
//         setHasInteracted(true);
//         return;
//       }
//       setCurrentStep("styling");
//     } else if (currentStep === "styling") {
//       setCurrentStep("review");
//     }
//   };

//   const handleBack = () => {
//     if (currentStep === "business") {
//       setCurrentStep("template");
//     } else if (currentStep === "content") {
//       setCurrentStep("business");
//     } else if (currentStep === "styling") {
//       setCurrentStep("content");
//     } else if (currentStep === "review") {
//       setCurrentStep("styling");
//     }
//   };

//   const handleSubmit = async () => {
//     if (!selectedTemplate || !templateData.businessName || !templateData.heroTitle) {
//       setHasInteracted(true);
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const response = await fetch("/api/generate-website", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           templateId: selectedTemplate,
//           data: templateData,
//           locale,
//         }),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         router.push(`/${locale}/dashboard?generated=${result.id}`);
//       } else {
//         throw new Error("Failed to generate website");
//       }
//     } catch (error) {
//       console.error("Generation error:", error);
//       alert(locale === "tr" ? "Website oluşturulurken hata oluştu" : "Error generating website");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const steps: Array<{ id: WizardStep; label: string; icon: string }> = [
//     { id: "template", label: locale === "tr" ? "Şablon" : "Template", icon: "🎨" },
//     { id: "business", label: locale === "tr" ? "İşletme" : "Business", icon: "🏢" },
//     { id: "content", label: locale === "tr" ? "İçerik" : "Content", icon: "📝" },
//     { id: "styling", label: locale === "tr" ? "Tasarım" : "Styling", icon: "🎨" },
//     { id: "review", label: locale === "tr" ? "Önizleme" : "Preview", icon: "👀" },
//   ];

//   const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
//       {/* Header with Progress */}
//       <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             {/* Progress Steps */}
//             <div className="flex items-center gap-2">
//               {steps.map((step, idx) => (
//                 <React.Fragment key={step.id}>
//                   <button
//                     type="button"
//                     onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
//                     disabled={idx > currentStepIndex}
//                     className={cls(
//                       "flex items-center gap-2 transition-all duration-300",
//                       idx <= currentStepIndex ? "cursor-pointer" : "cursor-not-allowed opacity-50"
//                     )}
//                   >
//                     <div className={cls(
//                       "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
//                       idx === currentStepIndex
//                         ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
//                         : idx < currentStepIndex
//                         ? "bg-green-500 text-white"
//                         : "bg-gray-200 dark:bg-gray-700 text-gray-500"
//                     )}>
//                       {idx < currentStepIndex ? "✓" : idx + 1}
//                     </div>
//                     <span className={cls(
//                       "hidden sm:inline text-sm font-medium",
//                       idx === currentStepIndex ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"
//                     )}>
//                       {step.label}
//                     </span>
//                   </button>
//                   {idx < steps.length - 1 && (
//                     <div className={cls(
//                       "h-0.5 w-8 transition-all",
//                       idx < currentStepIndex ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
//                     )} />
//                   )}
//                 </React.Fragment>
//               ))}
//             </div>

//             {/* Cancel Button */}
//             <button
//               type="button"
//               onClick={() => router.push(`/${locale}/dashboard`)}
//               className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
//             >
//               {locale === "tr" ? "İptal" : "Cancel"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          
//           {/* Step 1: Template Selection */}
//           {currentStep === "template" && (
//             <div className="space-y-6 animate-fadeIn">
//               <div className="text-center">
//                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//                   {locale === "tr" ? "Şablon Seçin" : "Choose a Template"}
//                 </h2>
//                 <p className="text-gray-600 dark:text-gray-400">
//                   {locale === "tr" 
//                     ? "İşletmeniz için en uygun şablonu seçin" 
//                     : "Select the perfect template for your business"}
//                 </p>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {themeData.map((theme) => (
//                   <button
//                     key={theme.id}
//                     type="button"
//                     onClick={() => setSelectedTemplate(theme.id)}
//                     className={cls(
//                       "relative group border-2 rounded-xl p-4 text-left transition-all duration-300 hover:shadow-lg",
//                       selectedTemplate === theme.id
//                         ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
//                         : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
//                     )}
//                   >
//                     {/* Preview Image */}
//                     <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 overflow-hidden">
//                       <img 
//                         src={theme.preview} 
//                         alt={theme.name}
//                         className="w-full h-full object-cover"
//                         onError={(e) => {
//                           e.currentTarget.src = `/templates/${theme.id}/preview.png`;
//                         }}
//                       />
//                     </div>

//                     {/* Theme Info */}
//                     <h3 className="font-bold text-gray-900 dark:text-white mb-1">{theme.name}</h3>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{theme.description}</p>

//                     {/* Features */}
//                     {theme.features.length > 0 && (
//                       <div className="flex flex-wrap gap-1">
//                         {theme.features.slice(0, 3).map((feature, idx) => (
//                           <span 
//                             key={idx}
//                             className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
//                           >
//                             {feature}
//                           </span>
//                         ))}
//                       </div>
//                     )}

//                     {/* Selected Indicator */}
//                     {selectedTemplate === theme.id && (
//                       <div className="absolute top-2 right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
//                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </div>
//                     )}
//                   </button>
//                 ))}
//               </div>

//               {!selectedTemplate && hasInteracted && (
//                 <p className="text-center text-sm text-red-600 dark:text-red-400">
//                   {locale === "tr" ? "Lütfen bir şablon seçin" : "Please select a template"}
//                 </p>
//               )}
//             </div>
//           )}

//           {/* Step 2: Business Info - TODO */}
//           {currentStep === "business" && (
//             <div className="text-center py-20">
//               <h2 className="text-2xl font-bold mb-4">Business Info Step (Coming Soon)</h2>
//               <p className="text-gray-600">This step will be implemented next</p>
//             </div>
//           )}

//           {/* Step 3: Content - TODO */}
//           {currentStep === "content" && (
//             <div className="text-center py-20">
//               <h2 className="text-2xl font-bold mb-4">Content Step (Coming Soon)</h2>
//             </div>
//           )}

//           {/* Step 4: Styling - TODO */}
//           {currentStep === "styling" && (
//             <div className="text-center py-20">
//               <h2 className="text-2xl font-bold mb-4">Styling Step (Coming Soon)</h2>
//             </div>
//           )}

//           {/* Step 5: Review - TODO */}
//           {currentStep === "review" && (
//             <div className="text-center py-20">
//               <h2 className="text-2xl font-bold mb-4">Review Step (Coming Soon)</h2>
//             </div>
//           )}

//           {/* Navigation Buttons */}
//           <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
//             <button
//               type="button"
//               onClick={handleBack}
//               disabled={currentStep === "template"}
//               className={cls(
//                 "px-6 py-3 rounded-lg font-medium transition-all",
//                 currentStep === "template"
//                   ? "invisible"
//                   : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
//               )}
//             >
//               ← {locale === "tr" ? "Geri" : "Back"}
//             </button>

//             {currentStep === "review" ? (
//               <button
//                 type="button"
//                 onClick={handleSubmit}
//                 disabled={isSubmitting}
//                 className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isSubmitting 
//                   ? (locale === "tr" ? "Oluşturuluyor..." : "Generating...") 
//                   : (locale === "tr" ? "Website Oluştur" : "Generate Website")}
//               </button>
//             ) : (
//               <button
//                 type="button"
//                 onClick={handleNext}
//                 className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
//               >
//                 {locale === "tr" ? "İleri" : "Next"} →
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
