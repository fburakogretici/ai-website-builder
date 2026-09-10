"use client";

import React, { useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface Model {
    id: string;
    name: string;
    descriptionKey: string;
    providerName: string;
}

interface ModelSelectorProps {
    availableModels: Model[];
    selectedModel: string;
    onModelSelect: (modelId: string) => void;
    onNewChat?: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function ModelSelector({
    availableModels,
    selectedModel,
    onModelSelect,
    onNewChat,
    isOpen,
    onClose
}: ModelSelectorProps) {
    const locale = useLocale();
    const t = useTranslations('settings.modelDescriptions');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const selectedModelData = availableModels.find(m => m.id === selectedModel);

    return (
        <div
            ref={dropdownRef}
            className="absolute left-0 right-0 bottom-full mb-2 w-full sm:w-80 sm:left-auto sm:right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
            {/* Model Cards */}
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {availableModels.map((model) => {
                    const isSelected = model.id === selectedModel;

                    return (
                        <button
                            key={model.id}
                            onClick={() => {
                                onModelSelect(model.id);
                                onClose();
                            }}
                            className={`w-full text-left px-4 py-4 transition-all duration-200 border-b border-gray-100 dark:border-slate-700/50 last:border-0 ${isSelected
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                {/* Model Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                            {model.name}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">
                                        {t(model.descriptionKey)}
                                    </p>
                                </div>

                                {/* Checkmark */}
                                {isSelected && (
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
