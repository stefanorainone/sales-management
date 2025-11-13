import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function PUT(request: NextRequest) {
  try {
    const { userId, email, displayName, role, team, password, requestingUserId } = await request.json();

    if (!userId || !email || !displayName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'Unauthorized: Only admins can update users' },
        { status: 403 }
      );
    }

    // Update user in Firebase Auth
    const updateData: any = {
      email,
      displayName,
    };

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    await adminAuth!.updateUser(userId, updateData);

    // Update user document in Firestore
    const updatedUser = {
      email,
      displayName,
      role,
      team: team || 'sales',
      updatedAt: new Date(),
      updatedBy: requestingUserId,
    };

    await adminDb!.collection('users').doc(userId).update(updatedUser);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        ...updatedUser,
      },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
