import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserApiKey, setUserApiKey, deleteUserApiKey, validateAnthropicKey, hasUserApiKey } from '@/utils/api-keys';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/user/api-keys
 * Get list of configured API providers for the user
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

        // Get configured providers (don't return actual keys)
        const { data, error } = await supabase
            .from('user_api_keys')
            .select('api_provider, is_active, created_at, updated_at')
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to fetch API keys:', error);
            return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
        }

        return NextResponse.json({ providers: data || [] });
    } catch (error: any) {
        console.error('GET /api/user/api-keys error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/user/api-keys
 * Save or update user's API key
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { apiKey, provider = 'anthropic', validate = true } = body;

        if (!apiKey || !apiKey.trim()) {
            return NextResponse.json({ error: 'API key is required' }, { status: 400 });
        }

        // Optionally validate the API key
        if (validate && provider === 'anthropic') {
            const isValid = await validateAnthropicKey(apiKey);
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid API key. Please check your key and try again.' },
                    { status: 400 }
                );
            }
        }

        // Save the API key
        const success = await setUserApiKey(user.id, apiKey, provider, supabase);

        if (!success) {
            return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'API key saved successfully',
            provider
        });
    } catch (error: any) {
        console.error('POST /api/user/api-keys error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/user/api-keys
 * Delete user's API key for a specific provider
 */
export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider') || 'anthropic';

        const success = await deleteUserApiKey(user.id, provider as 'anthropic' | 'openai', supabase);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'API key deleted successfully'
        });
    } catch (error: any) {
        console.error('DELETE /api/user/api-keys error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
