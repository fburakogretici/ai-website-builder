"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ThemeOption = {
  id: string;
  name: string;
  description: string;
  gradient: string;
  accentColor: string;
};

export type SiteBlueprint = {
  projectName: string;
  websiteGoal: string;
  targetAudience: string;
  aiPrompt: string;
  themeId: string;
};

type NewProjectWizardProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (blueprint: SiteBlueprint) => Promise<void> | void;
  themeOptions?: ThemeOption[];
  isSubmitting?: boolean;
  defaultPrompt?: string;
};

const DEFAULT_THEME_OPTIONS: ThemeOption[] = [
  {
    id: "modern-gradient",
    name: "Modern Gradient",
    description: "Bold colors and dynamic gradients",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    accentColor: "bg-indigo-600",
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Clean, spacious and professional",
    gradient: "from-gray-50 via-white to-gray-100",
    accentColor: "bg-slate-800",
  },
  {
    id: "dark-elegant",
    name: "Dark Elegant",
    description: "Sophisticated dark mode experience",
    gradient: "from-slate-900 via-slate-800 to-slate-900",
    accentColor: "bg-violet-500",
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    description: "Inviting orange and red tones",
    gradient: "from-orange-400 via-red-400 to-pink-500",
    accentColor: "bg-orange-600",
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Calm blues and teals",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    accentColor: "bg-blue-600",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural and earthy palette",
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    accentColor: "bg-green-600",
  },
];

const INITIAL_STATE: SiteBlueprint = {
  projectName: "",
  websiteGoal: "",
  targetAudience: "",
  aiPrompt: "",
  themeId: DEFAULT_THEME_OPTIONS[0]?.id ?? "modern-gradient",
};

type WizardStep = "basics" | "prompt" | "theme" | "review";

export function NewProjectWizard({
  open,
  onClose,
  onSubmit,
  themeOptions,
  isSubmitting = false,
  defaultPrompt = "",
}: NewProjectWizardProps) {
  const themes = useMemo(
    () => (themeOptions?.length ? themeOptions : DEFAULT_THEME_OPTIONS),
    [themeOptions]
  );

  const [currentStep, setCurrentStep] = useState<WizardStep>("basics");
  const [formState, setFormState] = useState<SiteBlueprint>({
    ...INITIAL_STATE,
    aiPrompt: defaultPrompt,
  });

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentStep("basics");
      setFormState({
        ...INITIAL_STATE,
        aiPrompt: defaultPrompt,
      });
      setHasInteracted(false);
    }
  }, [defaultPrompt, open]);

  if (!open) {
    return null;
  }

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.projectName || !formState.websiteGoal || !formState.aiPrompt) {
      setHasInteracted(true);
      return;
    }

    await onSubmit(formState);
  };

  const handleClose = () => {
    setCurrentStep("basics");
    setFormState({
      ...INITIAL_STATE,
      aiPrompt: defaultPrompt,
    });
    setHasInteracted(false);
    onClose();
  };

  const fieldError = (value: string) => !value && hasInteracted;

  const steps: Array<{ id: WizardStep; label: string }> = [
    { id: "basics", label: "Basics" },
    { id: "prompt", label: "AI Prompt" },
    { id: "theme", label: "Theme" },
    { id: "review", label: "Review" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const selectedTheme = themes.find((t) => t.id === formState.themeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden transform transition-all">
        {/* Header with Progress */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-6 right-6 rounded-full bg-white/20 backdrop-blur p-2 text-white transition hover:bg-white/30"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-white mb-2">
              Create Your AI Website
            </h2>
            <p className="text-indigo-100">
              Let's build something amazing together in just a few steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-between max-w-2xl">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cls(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                      idx <= currentStepIndex
                        ? "bg-white text-indigo-600 shadow-lg"
                        : "bg-white/20 text-white/60"
                    )}
                  >
                    {idx < currentStepIndex ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={cls(
                      "mt-2 text-xs font-medium transition-colors",
                      idx <= currentStepIndex
                        ? "text-white"
                        : "text-white/50"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cls(
                      "h-1 flex-1 mx-2 rounded-full transition-all duration-300",
                      idx < currentStepIndex
                        ? "bg-white"
                        : "bg-white/20"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <form onSubmit={handleSubmit} className="p-8 md:p-12">
          {/* Step 1: Basics */}
          {currentStep === "basics" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Let's start with the basics
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Tell us about your project and who it's for
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Project Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    value={formState.projectName}
                    onChange={(e) => updateForm("projectName", e.target.value)}
                    placeholder="e.g. Nova Marketing Agency"
                    className={cls(
                      "w-full px-5 py-4 text-base rounded-2xl border-2 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all focus:outline-none focus:ring-4",
                      fieldError(formState.projectName)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                  />
                  {fieldError(formState.projectName) && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Please enter a project name
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Website Goal
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={formState.websiteGoal}
                      onChange={(e) => updateForm("websiteGoal", e.target.value)}
                      placeholder="What do you want to achieve?"
                      rows={4}
                      className={cls(
                        "w-full px-5 py-4 text-base rounded-2xl border-2 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all focus:outline-none focus:ring-4 resize-none",
                        fieldError(formState.websiteGoal)
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20"
                      )}
                    />
                    {fieldError(formState.websiteGoal) && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Please describe your goal
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Target Audience
                    </label>
                    <textarea
                      value={formState.targetAudience}
                      onChange={(e) => updateForm("targetAudience", e.target.value)}
                      placeholder="Who are you building this for?"
                      rows={4}
                      className="w-full px-5 py-4 text-base rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: AI Prompt */}
          {currentStep === "prompt" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Describe your vision
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Help our AI understand your brand voice, tone, and content needs
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  AI Prompt
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={formState.aiPrompt}
                    onChange={(e) => updateForm("aiPrompt", e.target.value)}
                    placeholder="Describe your brand story, preferred tone, must-have sections, CTAs, and any design preferences..."
                    rows={12}
                    className={cls(
                      "w-full px-6 py-5 text-base rounded-2xl border-2 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-gray-800/50 dark:to-gray-800/30 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all focus:outline-none focus:ring-4 resize-none",
                      fieldError(formState.aiPrompt)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : "border-indigo-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                    {formState.aiPrompt.length} characters
                  </div>
                </div>
                {fieldError(formState.aiPrompt) && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Please provide a prompt for the AI
                  </p>
                )}
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  💡 Tip: The more specific you are, the better results you'll get
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Theme Selection */}
          {currentStep === "theme" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Choose your style
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Pick a theme as a starting point—you can customize everything later
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {themes.map((theme) => {
                  const isSelected = formState.themeId === theme.id;
                  return (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() => updateForm("themeId", theme.id)}
                      className={cls(
                        "group relative overflow-hidden rounded-2xl border-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30",
                        isSelected
                          ? "border-indigo-500 shadow-lg shadow-indigo-500/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className={`h-32 bg-gradient-to-br ${theme.gradient} relative`}>
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-5">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {theme.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {theme.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === "review" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Ready to generate?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Review your inputs before we create your AI-powered website
                </p>
              </div>

              <div className="space-y-5">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 border border-indigo-100 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                        Project
                      </p>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {formState.projectName}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                            Goal
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {formState.websiteGoal}
                          </p>
                        </div>
                        {formState.targetAudience && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                              Audience
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {formState.targetAudience}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("basics")}
                      className="ml-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                      AI Prompt
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("prompt")}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {formState.aiPrompt}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedTheme?.gradient} shadow-lg`} />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1">
                          Theme
                        </p>
                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                          {selectedTheme?.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep("theme")}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={currentStepIndex > 0 ? handleBack : handleClose}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              disabled={isSubmitting}
            >
              {currentStepIndex > 0 ? "Back" : "Cancel"}
            </button>

            {currentStep === "review" ? (
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Website
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3"
              >
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

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
