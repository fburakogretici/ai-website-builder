import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationEmail, EmailType } from '@/utils/sendEmail';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, userId, data } = body;

    if (!type || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sendNotificationEmail(type as EmailType, userId, data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (result.skipped) {
      return NextResponse.json({ message: 'Email skipped based on user settings' });
    }

    return NextResponse.json({ success: true, data: result.data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

