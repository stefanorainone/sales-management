import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

/**
 * GET /api/admin/tasks/[taskId]
 * Recupera i dettagli completi di un task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Verifica autenticazione admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verifica che sia admin
    const userDoc = await adminDb!.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { taskId } = await params;

    console.log(`📖 Fetching task details: ${taskId}`);

    // Recupera il task
    const taskDoc = await adminDb!.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data();

    // Convert Firestore Timestamps to ISO strings
    const convertTimestamp = (timestamp: any): string | undefined => {
      if (!timestamp) return undefined;
      if (typeof timestamp === 'string') return timestamp;
      if (timestamp?.toDate) return timestamp.toDate().toISOString();
      if (timestamp?._seconds) return new Date(timestamp._seconds * 1000).toISOString();
      return undefined;
    };

    const task = {
      id: taskDoc.id,
      ...taskData,
      createdAt: convertTimestamp(taskData?.createdAt),
      updatedAt: convertTimestamp(taskData?.updatedAt),
      scheduledAt: convertTimestamp(taskData?.scheduledAt),
      completedAt: convertTimestamp(taskData?.completedAt),
      startedAt: convertTimestamp(taskData?.startedAt),
      dismissedAt: convertTimestamp(taskData?.dismissedAt),
      snoozedUntil: convertTimestamp(taskData?.snoozedUntil),
      originalScheduledAt: convertTimestamp(taskData?.originalScheduledAt),
    };

    console.log(`✅ Task fetched: ${taskId}`);

    return NextResponse.json({ task });

  } catch (error: any) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tasks/[taskId]
 * Elimina un task
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Verifica autenticazione admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verifica che sia admin
    const userDoc = await adminDb!.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { taskId } = await params;

    console.log(`🗑️ Deleting task: ${taskId}`);

    // Verifica che il task esista
    const taskDoc = await adminDb!.collection('tasks').doc(taskId).get();
    console.log(`📄 Task exists: ${taskDoc.exists}`);

    if (!taskDoc.exists) {
      console.log(`❌ Task not found: ${taskId}`);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data();
    console.log(`📋 Task data:`, { userId: taskData?.userId, type: taskData?.type, status: taskData?.status });

    // Elimina il task
    console.log(`🔥 Attempting to delete from Firestore...`);
    await adminDb!.collection('tasks').doc(taskId).delete();
    console.log(`🔥 Firestore delete completed`);

    console.log(`✅ Task deleted successfully: ${taskId}`);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
      taskId,
    });

  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function updateTask(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Verifica autenticazione admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verifica che sia admin
    const userDoc = await adminDb!.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { taskId } = await params;
    const updates = await req.json();

    console.log(`✏️ Updating task: ${taskId}`);

    // Verifica che il task esista
    const taskDoc = await adminDb!.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const currentTaskData = taskDoc.data();

    // Aggiorna il task
    await adminDb!.collection('tasks').doc(taskId).update({
      ...updates,
      updatedAt: new Date(),
      updatedBy: `admin_${decodedToken.uid}`,
    });

    console.log(`✅ Task updated: ${taskId}`);

    // Track task completion as activity
    if (updates.status === 'completed' && currentTaskData?.status !== 'completed' && currentTaskData) {
      console.log('🔄 Task completed, creating activity...');

      await adminDb!.collection('activities').add({
        userId: currentTaskData.userId,
        type: 'task',
        title: currentTaskData.title || 'Task completato',
        description: currentTaskData.description || '',
        status: 'completed',
        taskId: taskId,
        priority: currentTaskData.priority,
        scheduledAt: currentTaskData.scheduledAt || new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Activity "task" created for completed task');
    }

    // Rileggi il task aggiornato per restituirlo
    const updatedTaskDoc = await adminDb!.collection('tasks').doc(taskId).get();
    const updatedTaskData = updatedTaskDoc.data();

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      taskId,
      task: {
        id: updatedTaskDoc.id,
        ...updatedTaskData,
      },
    });

  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/tasks/[taskId]
 * Modifica un task esistente
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  return updateTask(req, context);
}

/**
 * PATCH /api/admin/tasks/[taskId]
 * Modifica parziale di un task esistente
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  return updateTask(req, context);
}
