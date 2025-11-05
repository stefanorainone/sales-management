import { NextRequest, NextResponse } from 'next/server';
import { getAIContext } from '@/lib/services/ai-context-service';

/**
 * GET /api/ai/context?userId=xxx
 * Recupera il contesto AI completo per un venditore
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const context = await getAIContext(userId);

    if (!context) {
      return NextResponse.json(
        { error: 'Context not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(context);
  } catch (error: any) {
    console.error('Error fetching AI context:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
