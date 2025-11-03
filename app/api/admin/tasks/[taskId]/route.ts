import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

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
    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Elimina il task
    await adminDb!.collection('tasks').doc(taskId).delete();

    console.log(`✅ Task deleted: ${taskId}`);

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

    // Aggiorna il task
    await adminDb!.collection('tasks').doc(taskId).update({
      ...updates,
      updatedAt: new Date(),
      updatedBy: `admin_${decodedToken.uid}`,
    });

    console.log(`✅ Task updated: ${taskId}`);

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
