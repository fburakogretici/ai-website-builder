import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // Basic email validation
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check if email already exists
        const { data: existingSubscriber } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', email)
            .single();

        if (existingSubscriber) {
            return NextResponse.json(
                { message: 'Already subscribed' },
                { status: 200 }
            );
        }

        // Insert new subscriber
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert({ email });

        if (error) {
            console.error('Newsletter subscription error:', error);
            return NextResponse.json(
                { error: 'Failed to subscribe' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Successfully subscribed' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
