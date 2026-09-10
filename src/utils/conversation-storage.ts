/**
 * Conversation Storage Utility
 * Save and load AI chat conversations from Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface MessageForDb {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string; // ISO string for database
}

/**
 * Save conversation to database
 * Uses UPSERT to update existing or create new
 */
export async function saveConversation(
    websiteId: string | null,
    userId: string,
    messages: Message[],
    supabase: SupabaseClient
): Promise<void> {
    // Can't save without websiteId (AI-Builder without saved website)
    if (!websiteId) {
        console.log('Skipping conversation save: no websiteId');
        return;
    }

    if (messages.length === 0) {
        console.log('Skipping conversation save: no messages');
        return;
    }

    try {
        // Convert Date objects to ISO strings for JSONB storage
        const messagesForDb: MessageForDb[] = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
        }));

        const { error } = await supabase
            .from('conversations')
            .upsert({
                website_id: websiteId,
                user_id: userId,
                messages: messagesForDb,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'website_id'
            });

        if (error) {
            console.error('Failed to save conversation:', error);
            throw error;
        }

        console.log(`✅ Saved ${messages.length} messages for website ${websiteId}`);
    } catch (error) {
        console.error('Error saving conversation:', error);
        // Don't throw - saving is non-critical, shouldn't break UX
    }
}

/**
 * Load conversation from database
 * Returns empty array if not found or error
 */
export async function loadConversation(
    websiteId: string | null,
    supabase: SupabaseClient
): Promise<Message[]> {
    if (!websiteId) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('messages')
            .eq('website_id', websiteId)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle not found

        if (error) {
            console.error('Failed to load conversation:', error);
            return [];
        }

        if (!data || !data.messages) {
            console.log('No conversation found for website:', websiteId);
            return [];
        }

        // Convert ISO strings back to Date objects
        const messages: Message[] = (data.messages as MessageForDb[]).map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
        }));

        console.log(`✅ Loaded ${messages.length} messages for website ${websiteId}`);
        return messages;
    } catch (error) {
        console.error('Error loading conversation:', error);
        return [];
    }
}

/**
 * Delete conversation from database
 */
export async function deleteConversation(
    websiteId: string,
    supabase: SupabaseClient
): Promise<void> {
    try {
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('website_id', websiteId);

        if (error) {
            console.error('Failed to delete conversation:', error);
            throw error;
        }

        console.log(`✅ Deleted conversation for website ${websiteId}`);
    } catch (error) {
        console.error('Error deleting conversation:', error);
    }
}
