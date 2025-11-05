import { NextRequest, NextResponse } from 'next/server';
import { analyzeTaskNotes } from '@/lib/services/ai-service';
import { adminDb } from '@/lib/firebase/admin';
import { addTaskToContext } from '@/lib/services/ai-context-service';
import type { AITask } from '@/types';

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

        // Carica il task completo per aggiungerlo al contesto AI
        const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
        if (taskDoc.exists) {
          const taskData = taskDoc.data();
          const completedTask: AITask = {
            id: taskDoc.id,
            userId: taskData?.userId,
            type: taskData?.type,
            title: taskData?.title,
            description: taskData?.description,
            aiRationale: taskData?.aiRationale,
            priority: taskData?.priority,
            status: 'completed',
            scheduledAt: taskData?.scheduledAt,
            createdAt: taskData?.createdAt,
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            notes,
            outcome,
            actualDuration,
            attachments: attachments || [],
            aiAnalysis: analysis.analysis,
            guidelines: taskData?.guidelines || [],
            bestPractices: taskData?.bestPractices || [],
            commonMistakes: taskData?.commonMistakes || [],
            script: taskData?.script || '',
            estimatedDuration: taskData?.estimatedDuration,
            clientName: taskData?.clientName,
            dealTitle: taskData?.dealTitle,
          } as AITask;

          // Aggiungi il task al contesto AI del venditore
          // TODO: In futuro, qui si potranno aggiungere trascrizioni OCR/AI dei file allegati
          await addTaskToContext(completedTask.userId, completedTask, attachments?.map((url: string) => ({
            url,
            fileName: url.split('/').pop() || 'file',
            transcription: '', // TODO: Implementare OCR/trascrizione AI
            summary: '', // TODO: Implementare riassunto AI del contenuto
          })));

          console.log(`Task ${taskId} added to AI context for user ${completedTask.userId}`);
        }
      } catch (firestoreError) {
        console.error('Error saving to Firestore or AI context:', firestoreError);
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
