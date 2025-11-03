import { NextRequest, NextResponse } from 'next/server';
import { analyzeTaskNotes } from '@/lib/services/ai-service';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, taskType, clientName, dealTitle, notes, outcome, actualDuration, estimatedDuration, attachments } = body;

    const analysis = await analyzeTaskNotes({
      taskId,
      taskType,
      clientName,
      dealTitle,
      notes,
      outcome,
    });

    // Save task completion data to Firestore
    if (adminDb && taskId) {
      try {
        await adminDb.collection('tasks').doc(taskId).update({
          status: 'completed',
          notes,
          outcome,
          actualDuration,
          attachments: attachments || [],
          aiAnalysis: analysis.analysis,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`Task ${taskId} updated in Firestore with completion data`);
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        // Continue even if Firestore save fails
      }
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing notes:', error);
    return NextResponse.json(
      { error: 'Failed to analyze notes' },
      { status: 500 }
    );
  }
}
