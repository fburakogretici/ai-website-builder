"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";

type Provider = 'anthropic' | 'openai';

export default function ApiKeysPage() {
    const [selectedProvider, setSelectedProvider] = useState<Provider>('anthropic');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    const supabase = createBrowserClient();

    const providerInfo = {
        anthropic: {
            name: 'Anthropic Claude',
            model: 'Claude 3.5 Haiku',
            placeholder: 'sk-ant-api03-...',
            keyPrefix: 'sk-ant-',
            consoleUrl: 'https://console.anthropic.com/settings/keys',
            icon: '🧠'
        },
        openai: {
            name: 'OpenAI GPT',
            model: 'GPT-4o Mini',
            placeholder: 'sk-proj-...',
            keyPrefix: 'sk-',
            consoleUrl: 'https://platform.openai.com/api-keys',
            icon: '🤖'
        }
    };

    useEffect(() => {
        loadUserKey();
    }, [selectedProvider]);

    const loadUserKey = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/user/api-keys', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const providerHasKey = data.providers?.some(
                    (p: any) => p.api_provider === selectedProvider && p.is_active
                );
                setHasKey(providerHasKey);
            }
        } catch (error) {
            console.error('Error loading API key:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            toast.error('Lütfen bir API anahtarı girin');
            return;
        }

        const info = providerInfo[selectedProvider];
        if (!apiKey.startsWith(info.keyPrefix)) {
            toast.error(`Geçersiz ${info.name} API anahtarı formatı`);
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Oturum bulunamadı');
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
                toast.success(`${info.name} API anahtarı kaydedildi!`);
                setHasKey(true);
                setApiKey('');
                setShowKey(false);
            } else {
                const data = await response.json();
                toast.error(data.error || 'Kayıt başarısız');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`${providerInfo[selectedProvider].name} API anahtarınızı silmek istediğinizden emin misiniz?`)) {
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/user/api-keys?provider=${selectedProvider}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                toast.success('API anahtarı silindi');
                setHasKey(false);
            } else {
                toast.error('Silme başarısız');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
                <h2 className="text-2xl font-bold text-white">AI Provider Ayarları</h2>
                <p className="text-indigo-100 mt-1">Kendi AI API anahtarlarınızı kullanın</p>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Provider Selection */}
                <div className="mb-6">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        {(Object.keys(providerInfo) as Provider[]).map((provider) => (
                            <button
                                key={provider}
                                onClick={() => setSelectedProvider(provider)}
                                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${selectedProvider === provider
                                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <span>{providerInfo[provider].icon}</span>
                                <span>{providerInfo[provider].name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                {hasKey && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-200">API Anahtarı Aktif</h3>
                                    <p className="text-sm text-green-700 dark:text-green-300">{providerInfo[selectedProvider].name} kullanılıyor</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {providerInfo[selectedProvider].name} API Anahtarı
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={providerInfo[selectedProvider].placeholder}
                                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                disabled={loading || saving}
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showKey ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        <div className="flex justify-between mt-2">
                            <p className="text-xs text-gray-500">API anahtarı şifreli saklanır</p>
                            <a href={providerInfo[selectedProvider].consoleUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800">
                                API Key Al →
                            </a>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading || saving || !apiKey.trim()}
                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>

                {/* Security Note */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Güvenlik</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                API anahtarlarınız PostgreSQL pgcrypto ile şifrelenir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
