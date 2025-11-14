import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/services/ai-service';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

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

    const authenticatedUserId = decodedToken.uid;

    // 2. Parse request body
    const body = await request.json();
    const { userId, userName, date } = body;

    // 3. Verify authorization - user can only request their own briefing
    if (userId !== authenticatedUserId) {
      console.error(`Authorization failed: User ${authenticatedUserId} tried to access briefing for ${userId}`);
      return NextResponse.json(
        { error: 'Forbidden - You can only access your own briefing' },
        { status: 403 }
      );
    }

    // 4. Input validation
    if (!userId || !userName) {
      return NextResponse.json(
        { error: 'Bad Request - Missing required fields: userId, userName' },
        { status: 400 }
      );
    }

    // 5. Rate limiting check - DISABLED (requires Firestore composite index)
    // TODO: Create composite index for briefings collection: userId (asc) + createdAt (asc)
    // const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    // const recentBriefingsSnapshot = await adminDb!.collection('briefings')
    //   .where('userId', '==', userId)
    //   .where('createdAt', '>', oneHourAgo)
    //   .get();
    //
    // if (recentBriefingsSnapshot.size >= 10) {
    //   console.warn(`Rate limit exceeded for user ${userId}: ${recentBriefingsSnapshot.size} briefings in last hour`);
    //   return NextResponse.json(
    //     { error: 'Too Many Requests - You can generate max 10 briefings per hour' },
    //     { status: 429 }
    //   );
    // }

    // First, load relationships from Firestore
    console.log('[Briefing API] Loading relationships for userId:', userId);
    const relationshipsPromise = adminDb!.collection('relationships')
      .where('userId', '==', userId)
      .get();

    const relationshipsTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Relationships query timeout')), 8000)
    );

    let relationships: any[] = [];
    try {
      const relationshipsSnapshot = await Promise.race([relationshipsPromise, relationshipsTimeoutPromise]) as FirebaseFirestore.QuerySnapshot;
      console.log('[Briefing API] Found', relationshipsSnapshot.size, 'relationships');

      relationships = relationshipsSnapshot.docs.map(doc => {
        const data = doc.data();
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
          name: data.name,
          company: data.company,
          role: data.role,
          strength: data.strength,
          importance: data.importance,
          category: data.category,
          lastContact: data.lastContact ? convertTimestamp(data.lastContact) : null,
          nextAction: data.nextAction || '',
          whatICanGive: data.whatICanGive || [],
          whatICanReceive: data.whatICanReceive || [],
          valueBalance: data.valueBalance,
          actionsHistory: data.actionsHistory || [],
          notes: data.notes || [],
        };
      });
    } catch (error) {
      console.error('[Briefing API] Error loading relationships:', error);
    }

    // Load existing tasks from Firestore using Admin SDK
    console.log('[Briefing API] Loading existing tasks for userId:', userId);

    // Add timeout to Firestore query (8 seconds)
    const tasksPromise = adminDb!.collection('tasks')
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .get();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore query timeout')), 8000)
    );

    const tasksSnapshot = await Promise.race([tasksPromise, timeoutPromise]) as FirebaseFirestore.QuerySnapshot;

    console.log('[Briefing API] Found', tasksSnapshot.size, 'tasks in Firestore for userId:', userId);
    console.log('[Briefing API] Tasks query: userId ==', userId, '&& status == pending');

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
        updatedAt: convertTimestamp(data.updatedAt),
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
        // IMPORTANT: Load all AI-generated fields
        expectedOutputFormat: data.expectedOutputFormat || undefined,
        guidelines: data.guidelines || [],
        bestPractices: data.bestPractices || [],
        commonMistakes: data.commonMistakes || [],
        demoScript: data.demoScript || '',
        emailDraft: data.emailDraft || '',
      };
    });

    console.log('[Briefing API] Converted tasks:', existingTasks.length);
    if (existingTasks.length > 0) {
      console.log('[Briefing API] First task sample:', {
        id: existingTasks[0].id,
        userId: existingTasks[0].userId,
        title: existingTasks[0].title,
        status: existingTasks[0].status,
        scheduledAt: existingTasks[0].scheduledAt,
      });
    }

    // Return existing tasks - NO automatic generation
    // Tasks are now created manually by admin in Task Management page
    console.log('[Briefing API] Returning existing tasks (no automatic generation)');

    return NextResponse.json({
      message: `Buongiorno ${userName}! Ecco i tuoi task per oggi.`,
      tasks: existingTasks,
      insights: []
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
