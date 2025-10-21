import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role, team, requestingUserId } = await request.json();

    if (!email || !password || !displayName || !role) {
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
        { error: 'Unauthorized: Only admins can create users' },
        { status: 403 }
      );
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth!.createUser({
      email,
      password,
      displayName,
    });

    // Create user document in Firestore
    const newUser = {
      email: userRecord.email,
      displayName,
      role: role || 'seller',
      team: team || 'sales',
      createdAt: new Date(),
      createdBy: requestingUserId,
    };

    await adminDb!.collection('users').doc(userRecord.uid).set(newUser);

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.uid,
        ...newUser,
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
