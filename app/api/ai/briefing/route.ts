import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/services/ai-service';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, deals, clients, recentActivities, yesterdayTasks, date } = body;

    // First, load existing tasks from Firestore using Admin SDK
    console.log('[Briefing API] Loading existing tasks for userId:', userId);

    const tasksSnapshot = await adminDb!.collection('tasks')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    console.log('[Briefing API] Found', tasksSnapshot.size, 'tasks in Firestore');

    // Convert Firestore tasks to the format expected by the frontend
    const existingTasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();

      // Convert Admin SDK Timestamp format to ISO string
      const convertTimestamp = (timestamp: any): string => {
        if (typeof timestamp === 'string') return timestamp;
        if (timestamp?.toDate) return timestamp.toDate().toISOString();
        if (timestamp?._seconds) {
          return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000).toISOString();
        }
        return new Date().toISOString();
      };

      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status,
        priority: data.priority,
        scheduledAt: convertTimestamp(data.scheduledAt),
        createdAt: convertTimestamp(data.createdAt),
        createdBy: data.createdBy || 'ai',
        dealId: data.dealId || null,
        clientId: data.clientId || null,
        estimatedDuration: data.estimatedDuration || 15,
        aiRationale: data.aiRationale || '',
        clientName: data.clientName || '',
        dealTitle: data.dealTitle || '',
        objectives: data.objectives || [],
        script: data.script || '',
        talkingPoints: data.talkingPoints || [],
        clientContext: data.clientContext || '',
        dealContext: data.dealContext || '',
        expectedOutputFormat: data.expectedOutputFormat || undefined,
      };
    });

    console.log('[Briefing API] Converted tasks:', existingTasks.length);

    // If we have existing tasks, return them with the briefing
    if (existingTasks.length > 0) {
      console.log('[Briefing API] Returning existing tasks without generating new ones');

      // Generate only the briefing message, not new tasks
      const briefing = await generateDailyBriefing({
        userId,
        userName,
        deals,
        clients,
        recentActivities,
        yesterdayTasks,
        date,
      });

      // Override the tasks with the existing ones from Firestore
      return NextResponse.json({
        ...briefing,
        tasks: existingTasks
      });
    }

    // If no existing tasks, generate new ones with AI
    console.log('[Briefing API] No existing tasks found, generating new ones with AI');
    const briefing = await generateDailyBriefing({
      userId,
      userName,
      deals,
      clients,
      recentActivities,
      yesterdayTasks,
      date,
    });

    return NextResponse.json(briefing);
  } catch (error) {
    console.error('Error generating briefing:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
