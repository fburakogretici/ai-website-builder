import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Model definitions - Using official API model IDs
// Source: https://docs.anthropic.com/en/docs/about-claude/models
// Source: https://platform.openai.com/docs/models
const MODEL_CATALOG = {
    anthropic: [
        // Claude 4.5 models (latest)
        { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', descriptionKey: 'claudeSonnet45' },
        { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', descriptionKey: 'claudeHaiku45' },
        { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', descriptionKey: 'claudeOpus45' },
    ],
    openai: [
        // GPT-4o models (latest)
        { id: 'gpt-4o', name: 'GPT-4o', descriptionKey: 'gpt4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', descriptionKey: 'gpt4oMini' },
        // GPT-4 Turbo
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', descriptionKey: 'gpt4Turbo' },
        { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview', descriptionKey: 'gpt4TurboPreview' },
        // o1 reasoning models
        { id: 'o1-preview', name: 'o1 Preview', descriptionKey: 'o1Preview' },
        { id: 'o1-mini', name: 'o1 Mini', descriptionKey: 'o1Mini' },
    ]
};

/**
 * GET /api/user/available-models
 * Returns available AI models based on user's configured API keys
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user from auth header
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's active API providers
        const { data: apiKeys, error: keysError } = await supabase
            .from('user_api_keys')
            .select('api_provider, is_active')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (keysError) {
            console.error('Failed to fetch API keys:', keysError);
            return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
        }

        // Build available models list
        const availableModels: any[] = [];
        const activeProviders = new Set(apiKeys?.map(k => k.api_provider) || []);

        // Add models from active providers
        if (activeProviders.has('anthropic')) {
            MODEL_CATALOG.anthropic.forEach(model => {
                availableModels.push({
                    ...model,
                    provider: 'anthropic',
                    providerName: 'Anthropic Claude'
                });
            });
        }

        if (activeProviders.has('openai')) {
            MODEL_CATALOG.openai.forEach(model => {
                availableModels.push({
                    ...model,
                    provider: 'openai',
                    providerName: 'OpenAI GPT'
                });
            });
        }

        return NextResponse.json({
            models: availableModels,
            hasApiKeys: availableModels.length > 0,
            activeProviders: Array.from(activeProviders)
        });
    } catch (error: any) {
        console.error('GET /api/user/available-models error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
