import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { logActivity } from '@/lib/services/activity-logger';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { action, entityType, entityId, entityName, details, metadata } = body;

    // 3. Validation
    if (!action || !entityType) {
      return NextResponse.json(
        { error: 'Bad Request - Missing required fields: action, entityType' },
        { status: 400 }
      );
    }

    // 4. Get user info from token
    const userId = decodedToken.uid;
    const userName = decodedToken.name || decodedToken.email || 'Unknown';
    const userEmail = decodedToken.email || 'unknown@example.com';
    const userRole = (decodedToken as any).role || 'seller';

    // 5. Log activity
    await logActivity({
      userId,
      userName,
      userEmail,
      userRole,
      action,
      entityType,
      entityId,
      entityName,
      details: details || {},
      metadata: metadata || {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
