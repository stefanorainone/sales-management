import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(request: NextRequest) {
  try {
    const { requestingUserId } = await request.json();

    // Verify that requesting user is admin
    if (!requestingUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: No user ID provided' },
        { status: 401 }
      );
    }

    const requestingUserDoc = await adminDb!.collection('users').doc(requestingUserId).get();

    if (!requestingUserDoc.exists || requestingUserDoc.data()?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can clear tasks' },
        { status: 403 }
      );
    }

    // Get all tasks
    const tasksSnapshot = await adminDb!.collection('tasks').get();
    const totalTasks = tasksSnapshot.size;

    if (totalTasks === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tasks found in database',
        deletedCount: 0,
      });
    }

    // Delete in batches (Firestore limit is 500 operations per batch)
    const batchSize = 500;
    let deletedCount = 0;

    const batches = [];
    let currentBatch = adminDb!.batch();
    let operationCount = 0;

    for (const doc of tasksSnapshot.docs) {
      currentBatch.delete(doc.ref);
      operationCount++;
      deletedCount++;

      if (operationCount === batchSize) {
        batches.push(currentBatch);
        currentBatch = adminDb!.batch();
        operationCount = 0;
      }
    }

    // Add remaining operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    await Promise.all(batches.map(batch => batch.commit()));

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all tasks`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('Error clearing tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear tasks' },
      { status: 500 }
    );
  }
}
