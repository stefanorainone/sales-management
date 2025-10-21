import { NextRequest, NextResponse } from 'next/server';
import { analyzeTaskNotes } from '@/lib/services/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskType, clientName, dealTitle, notes, outcome } = body;

    const analysis = await analyzeTaskNotes({
      taskId,
      taskType,
      clientName,
      dealTitle,
      notes,
      outcome,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing notes:', error);
    return NextResponse.json(
      { error: 'Failed to analyze notes' },
      { status: 500 }
    );
  }
}
