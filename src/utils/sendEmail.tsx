import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import WelcomeEmail from '@/emails/WelcomeEmail';
import NewWebsiteEmail from '@/emails/NewWebsiteEmail';
import React from 'react';

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;
function getResend() {
    if (!resendInstance) {
        resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type EmailType = 'welcome' | 'new_website';

interface EmailData {
    websiteName?: string;
    websiteUrl?: string;
    thumbnailUrl?: string;
}

export async function sendNotificationEmail(type: EmailType, userId: string, data: EmailData = {}) {
    try {
        // 1. Check user notification settings
        const { data: settings, error: settingsError } = await supabase
            .from('user_notification_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Error fetching settings:', settingsError);
            return { success: false, error: 'Database error' };
        }

        // Default to true if no settings found (opt-out model)
        const userSettings = settings || {
            new_website: true,
            weekly_report: true,
            promotions: false,
            security_alerts: true,
        };

        // 2. Determine if we should send email based on type and settings
        let shouldSend = false;
        let emailSubject = '';
        let emailComponent = null;
        let userEmail = '';

        // Fetch user email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        if (userError || !userData.user) {
            return { success: false, error: 'User not found' };
        }
        userEmail = userData.user.email!;

        switch (type) {
            case 'welcome':
                shouldSend = true; // Always send welcome email
                emailSubject = 'Welcome to NoCodePage! 🎉';
                emailComponent = <WelcomeEmail name={userData.user.user_metadata?.full_name || 'User'} />;
                break;

            case 'new_website':
                if (userSettings.new_website) {
                    shouldSend = true;
                    emailSubject = `Your new website "${data.websiteName}" is ready! 🚀`;
                    emailComponent = (
                        <NewWebsiteEmail
                            websiteName={data.websiteName}
                            websiteUrl={data.websiteUrl}
                            thumbnailUrl={data.thumbnailUrl}
                        />
                    );
                }
                break;
        }

        if (!shouldSend) {
            return { success: true, skipped: true };
        }

        // 3. Send Email (using lazy-loaded instance)
        const resend = getResend();
        const { data: emailResult, error: emailError } = await resend.emails.send({
            from: 'NoCodePage <onboarding@resend.dev>', // Update this with your verified domain in production
            to: [userEmail],
            subject: emailSubject,
            react: emailComponent as any, // Type assertion needed due to React version mismatch sometimes
        });

        if (emailError) {
            console.error('Resend Error:', emailError);
            return { success: false, error: emailError.message };
        }

        return { success: true, data: emailResult };

    } catch (error: any) {
        console.error('Email Sending Error:', error);
        return { success: false, error: error.message };
    }
}
