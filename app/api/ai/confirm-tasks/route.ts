import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sellerId, tasks } = await request.json();

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId is required' },
        { status: 400 }
      );
    }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'tasks array is required' },
        { status: 400 }
      );
    }

    // Save tasks to Firestore
    const savedTasks = [];

    for (const task of tasks) {
      const now = new Date().toISOString();

      // Generate scheduledAt if not present (default to today)
      let scheduledAt = task.scheduledAt;
      if (!scheduledAt) {
        const today = new Date();
        today.setHours(9, 0, 0, 0); // Default to 9 AM
        scheduledAt = today.toISOString();
      }

      const taskDoc = {
        userId: sellerId,
        type: task.type || 'call',
        title: task.title,
        description: task.description,
        aiRationale: task.aiRationale || '',
        priority: task.priority || 'medium',
        status: 'pending',
        scheduledAt: scheduledAt,
        objectives: task.objectives || [],
        confidence: task.confidence || 70,
        impactScore: task.impactScore || 70,
        relatedEntity: task.relatedEntity || null,
        clientName: task.relatedEntity?.name || '',
        dealTitle: task.relatedEntity?.type === 'deal' ? task.relatedEntity.name : '',
        createdAt: now,
        updatedAt: now,
        createdBy: 'admin_confirmed',
        estimatedDuration: task.estimatedDuration || 30,
        // IMPORTANT: Save all AI-generated fields
        expectedOutputFormat: task.expectedOutputFormat || null,
        guidelines: task.guidelines || [],
        bestPractices: task.bestPractices || [],
        commonMistakes: task.commonMistakes || [],
        script: task.script || '',
        talkingPoints: task.talkingPoints || [],
        demoScript: task.demoScript || '',
        emailDraft: task.emailDraft || '',
        clientContext: task.clientContext || '',
        dealContext: task.dealContext || '',
      };

      const docRef = await adminDb!.collection('tasks').add(taskDoc);
      savedTasks.push({ id: docRef.id, ...taskDoc });
    }

    return NextResponse.json({
      success: true,
      tasksSaved: savedTasks.length,
      tasks: savedTasks,
    });

  } catch (error: any) {
    console.error('Error confirming tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
