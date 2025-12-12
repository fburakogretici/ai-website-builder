"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Provider = 'anthropic' | 'openai';

export default function ApiKeysPage() {
    const t = useTranslations('settings.apiKeys');
    const [selectedProvider, setSelectedProvider] = useState<Provider>('anthropic');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasKey, setHasKey] = useState<Record<Provider, boolean>>({ anthropic: false, openai: false });
    const [isHovering, setIsHovering] = useState<Provider | null>(null);

    const supabase = createBrowserClient();

    const providerInfo = {
        anthropic: {
            name: 'Claude',
            fullName: 'Anthropic Claude',
            tagline: t('advancedReasoning'),
            models: ['Claude 4.5 Opus', 'Claude 4.5 Sonnet', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 3.5 Sonnet', 'Claude 3.5 Haiku'],
            placeholder: 'sk-ant-api03-xxxxx...',
            keyPrefix: 'sk-ant-',
            consoleUrl: 'https://console.anthropic.com/settings/keys',
            gradient: 'from-[#D97757] via-[#E8956A] to-[#F4B183]',
            bgGradient: 'from-[#D97757]/10 to-[#F4B183]/5',
            iconBg: 'bg-[#D97757]',
            ring: 'ring-[#D97757]/20',
            textColor: 'text-[#D97757]',
            logo: (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L13.09 8.26L18 5L14.74 9.91L21 11L14.74 12.09L18 17L13.09 13.74L12 20L10.91 13.74L6 17L9.26 12.09L3 11L9.26 9.91L6 5L10.91 8.26L12 2Z" />
                </svg>
            )
        },
        openai: {
            name: 'GPT',
            fullName: 'OpenAI GPT',
            tagline: t('versatile'),
            models: ['GPT-4.1', 'GPT-4o', 'GPT-4o Mini', 'GPT-4 Turbo', 'o1', 'o1 Mini', 'o3 Mini'],
            placeholder: 'sk-proj-xxxxx...',
            keyPrefix: 'sk-',
            consoleUrl: 'https://platform.openai.com/api-keys',
            gradient: 'from-[#10A37F] via-[#1DB587] to-[#34D399]',
            bgGradient: 'from-[#10A37F]/10 to-[#34D399]/5',
            iconBg: 'bg-[#10A37F]',
            ring: 'ring-[#10A37F]/20',
            textColor: 'text-[#10A37F]',
            logo: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9723V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1195 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.453l-.142.0805L8.704 5.4596a.7948.7948 0 0 0-.3927.6813zm1.0916-2.3229L12 8.5303l2.6019 1.5098v3.0184L12 14.5633l-2.6019-1.5047z" />
                </svg>
            )
        }
    };

    useEffect(() => {
        loadAllKeys();
    }, []);

    const loadAllKeys = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/user/api-keys', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const keys: Record<Provider, boolean> = { anthropic: false, openai: false };
                data.providers?.forEach((p: any) => {
                    if (p.api_provider === 'anthropic' && p.is_active) keys.anthropic = true;
                    if (p.api_provider === 'openai' && p.is_active) keys.openai = true;
                });
                setHasKey(keys);
            }
        } catch (error) {
            console.error('Error loading API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            toast.error(t('errors.enterKey'));
            return;
        }

        const info = providerInfo[selectedProvider];
        if (!apiKey.startsWith(info.keyPrefix)) {
            toast.error(t('errors.invalidFormat', { provider: info.name, prefix: info.keyPrefix }));
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error(t('errors.sessionNotFound'));
                return;
            }

            const response = await fetch('/api/user/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    apiKey: apiKey.trim(),
                    provider: selectedProvider,
                    validate: false
                })
            });

            if (response.ok) {
                toast.success(t('success.connected', { provider: info.fullName }));
                setHasKey(prev => ({ ...prev, [selectedProvider]: true }));
                setApiKey('');
                setShowKey(false);
            } else {
                const data = await response.json();
                toast.error(data.error || t('errors.connectionFailed'));
            }
        } catch (error) {
            toast.error(t('errors.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (provider: Provider) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/user/api-keys?provider=${provider}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                toast.success(t('success.removed'));
                setHasKey(prev => ({ ...prev, [provider]: false }));
            } else {
                toast.error(t('errors.operationFailed'));
            }
        } catch (error) {
            toast.error(t('errors.error'));
        } finally {
            setLoading(false);
        }
    };

    const info = providerInfo[selectedProvider];

    return (
        <div className="min-h-[calc(100vh-12rem)]">
            {/* Decorative Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br ${info.bgGradient} blur-3xl opacity-50 transition-all duration-700`}></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-3xl"></div>
            </div>

            <div className="relative space-y-4">
                {/* Provider Selection - Horizontal Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {(Object.keys(providerInfo) as Provider[]).map((provider) => {
                        const p = providerInfo[provider];
                        const isSelected = selectedProvider === provider;
                        const isConnected = hasKey[provider];
                        const isHovered = isHovering === provider;

                        return (
                            <button
                                key={provider}
                                onClick={() => setSelectedProvider(provider)}
                                onMouseEnter={() => setIsHovering(provider)}
                                onMouseLeave={() => setIsHovering(null)}
                                className={`
                                    group relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 ease-out
                                    ${isSelected
                                        ? `bg-gradient-to-br ${p.bgGradient} ring-2 ${p.ring} shadow-xl`
                                        : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50'
                                    }
                                `}
                            >
                                {/* Gradient Overlay on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-0 transition-opacity duration-300 ${isHovered && !isSelected ? 'opacity-[0.03]' : ''}`}></div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl ${p.iconBg} flex items-center justify-center shadow-lg transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                                            {p.logo}
                                        </div>
                                        {isConnected && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full border border-green-200 dark:border-green-800">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">{t('connected')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{p.fullName}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{p.tagline}</p>

                                    <div className="flex flex-wrap gap-1.5">
                                        {p.models.map((model) => (
                                            <span key={model} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-md">
                                                {model}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${p.gradient}`}></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Configuration Panel */}
                <div className="relative">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl shadow-gray-200/30 dark:shadow-none overflow-hidden">
                        {/* Gradient Header Line */}
                        <div className={`h-1 bg-gradient-to-r ${info.gradient}`}></div>

                        <div className="p-5 sm:p-8">
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${info.gradient}`}></span>
                                        {info.fullName} {t('configuration')}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {hasKey[selectedProvider] ? t('connectionActive') : t('enterApiKey')}
                                    </p>
                                </div>

                                {hasKey[selectedProvider] && (
                                    <button
                                        onClick={() => handleDelete(selectedProvider)}
                                        disabled={loading}
                                        className="group px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            {t('removeConnection')}
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* Input Group */}
                            <div className="space-y-6">
                                <div>
                                    <label className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        <span>{t('apiKeyLabel')}</span>
                                        <a
                                            href={info.consoleUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`text-xs font-medium ${info.textColor} hover:underline flex items-center gap-1`}
                                        >
                                            {t('createKey')}
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    </label>

                                    <div className="relative group">
                                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${info.gradient} rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300`}></div>
                                        <div className="relative">
                                            <input
                                                type={showKey ? "text" : "password"}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder={info.placeholder}
                                                className="w-full px-5 py-4 pr-24 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm transition-all"
                                                disabled={loading || saving}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                <button
                                                    onClick={() => setShowKey(!showKey)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    {showKey ? (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        {t('encryptionNote')}
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={loading || saving || !apiKey.trim()}
                                    className={`
                                        w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300
                                        bg-gradient-to-r ${info.gradient}
                                        hover:shadow-xl hover:shadow-gray-300/30 dark:hover:shadow-none hover:scale-[1.02]
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
                                        active:scale-[0.98]
                                    `}
                                >
                                    {saving ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('connecting')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            {hasKey[selectedProvider] ? t('updateKey') : t('connect')}
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
                    {[
                        { icon: '⚡', title: t('benefits.unlimited'), desc: t('benefits.unlimitedDesc'), color: 'from-amber-500 to-orange-500' },
                        { icon: '🎯', title: t('benefits.allModels'), desc: t('benefits.allModelsDesc'), color: 'from-blue-500 to-indigo-500' },
                        { icon: '🔒', title: t('benefits.security'), desc: t('benefits.securityDesc'), color: 'from-emerald-500 to-teal-500' }
                    ].map((item, i) => (
                        <div key={i} className="group relative p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-gray-200/30 dark:hover:shadow-none transition-all duration-300 hover:-translate-y-1">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-xl shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
