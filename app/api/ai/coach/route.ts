import { NextRequest, NextResponse } from 'next/server';
import { getCoachResponse } from '@/lib/services/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, question, context } = body;

    const response = await getCoachResponse({
      userId,
      userName,
      question,
      context,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error getting coach response:', error);
    return NextResponse.json(
      { error: 'Failed to get coach response' },
      { status: 500 }
    );
  }
}
