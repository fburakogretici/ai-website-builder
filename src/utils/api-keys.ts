const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || 'default-encryption-key-change-in-production';

/**
 * Encrypts an API key using PostgreSQL's pgcrypto
 */
export async function encryptApiKey(apiKey: string, supabaseClient: any): Promise<string> {
    const { data, error } = await supabaseClient.rpc('pgp_sym_encrypt', {
        data: apiKey,
        key: ENCRYPTION_KEY
    });

    if (error) {
        throw new Error(`Failed to encrypt API key: ${error.message}`);
    }

    // Convert bytea to base64 string for storage
    return Buffer.from(data).toString('base64');
}

/**
 * Decrypts an API key using PostgreSQL's pgcrypto
 */
export async function decryptApiKey(encryptedKey: string, supabaseClient: any): Promise<string> {
    // Convert base64 string back to bytea
    const bytea = Buffer.from(encryptedKey, 'base64');

    const { data, error } = await supabaseClient.rpc('pgp_sym_decrypt', {
        data: bytea,
        key: ENCRYPTION_KEY
    });

    if (error) {
        throw new Error(`Failed to decrypt API key: ${error.message}`);
    }

    return data;
}

/**
 * Get user's API key for a specific provider
 */
export async function getUserApiKey(
    userId: string,
    provider: 'anthropic' | 'openai' = 'anthropic',
    supabaseClient: any
): Promise<string | null> {
    const { data, error } = await supabaseClient
        .from('user_api_keys')
        .select('encrypted_api_key')
        .eq('user_id', userId)
        .eq('api_provider', provider)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        return null;
    }

    try {
        return await decryptApiKey(data.encrypted_api_key, supabaseClient);
    } catch (err) {
        console.error('Failed to decrypt API key:', err);
        return null;
    }
}

/**
 * Save or update user's API key
 */
export async function setUserApiKey(
    userId: string,
    apiKey: string,
    provider: 'anthropic' | 'openai' = 'anthropic',
    supabaseClient: any
): Promise<boolean> {
    try {
        const encryptedKey = await encryptApiKey(apiKey, supabaseClient);

        const { error } = await supabaseClient
            .from('user_api_keys')
            .upsert({
                user_id: userId,
                api_provider: provider,
                encrypted_api_key: encryptedKey,
                is_active: true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,api_provider'
            });

        if (error) {
            console.error('Failed to save API key:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Error in setUserApiKey:', err);
        return false;
    }
}

/**
 * Delete user's API key
 */
export async function deleteUserApiKey(
    userId: string,
    provider: 'anthropic' | 'openai' = 'anthropic',
    supabaseClient: any
): Promise<boolean> {
    const { error } = await supabaseClient
        .from('user_api_keys')
        .delete()
        .eq('user_id', userId)
        .eq('api_provider', provider);

    if (error) {
        console.error('Failed to delete API key:', error);
        return false;
    }

    return true;
}

/**
 * Validate Anthropic API key by making a test request
 */
export async function validateAnthropicKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'test' }]
            })
        });

        return response.ok;
    } catch (err) {
        console.error('API key validation failed:', err);
        return false;
    }
}

/**
 * Check if user has an API key configured
 */
export async function hasUserApiKey(
    userId: string,
    provider: 'anthropic' | 'openai' = 'anthropic',
    supabaseClient: any
): Promise<boolean> {
    const { data } = await supabaseClient
        .from('user_api_keys')
        .select('id')
        .eq('user_id', userId)
        .eq('api_provider', provider)
        .eq('is_active', true)
        .single();

    return !!data;
}
