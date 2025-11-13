import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function DELETE(request: NextRequest) {
  try {
    const { userId, requestingUserId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

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
        { error: 'Unauthorized: Only admins can delete users' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (userId === requestingUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user from Firebase Auth
    await adminAuth!.deleteUser(userId);

    // Delete user document from Firestore
    await adminDb!.collection('users').doc(userId).delete();

    // Optional: Delete user's associated data (tasks, clients, etc.)
    // You can add batch operations here to clean up user-related data
    // For example:
    // const batch = adminDb!.batch();
    // const tasksQuery = await adminDb!.collection('tasks').where('userId', '==', userId).get();
    // tasksQuery.docs.forEach(doc => batch.delete(doc.ref));
    // await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
