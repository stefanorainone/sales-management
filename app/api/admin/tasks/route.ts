import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

/**
 * GET /api/admin/tasks
 * Ottiene tutti i task di tutti i venditori
 */
export async function GET(req: NextRequest) {
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

    // Ottieni filtri dalla query
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    console.log('📊 Fetching all tasks...');

    // Query base
    let query = adminDb!.collection('tasks');

    // Applica filtri se presenti
    if (sellerId) {
      query = query.where('userId', '==', sellerId) as any;
    }
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const tasksSnapshot = await query.get();
    let tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      scheduledAt: doc.data().scheduledAt || new Date().toISOString(),
    })) as any[];

    // Filtro date (client-side se necessario)
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      tasks = tasks.filter(t => new Date(t.scheduledAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      tasks = tasks.filter(t => new Date(t.scheduledAt) <= toDate);
    }

    // Ottieni info venditori
    const usersSnapshot = await adminDb!.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      displayName: doc.data().displayName,
      email: doc.data().email,
    }));

    // Arricchisci task con nome venditore
    const enrichedTasks = tasks.map(task => ({
      ...task,
      sellerName: users.find(u => u.id === task.userId)?.displayName ||
                   users.find(u => u.id === task.userId)?.email ||
                   'Unknown',
    }));

    // Ordina per data scheduledAt (più recenti prima)
    enrichedTasks.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    return NextResponse.json({
      success: true,
      tasks: enrichedTasks,
      count: enrichedTasks.length,
      sellers: users,
    });

  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tasks
 * Crea un nuovo task manualmente
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      userId,
      type,
      title,
      description,
      priority,
      scheduledAt,
      objectives,
      clientName,
      dealTitle,
    } = body;

    // Validazione
    if (!userId || !type || !title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, scheduledAt' },
        { status: 400 }
      );
    }

    console.log('📝 Creating manual task...');

    // Crea il task
    const taskDoc = {
      userId,
      type,
      title,
      description: description || '',
      aiRationale: 'Task creato manualmente dall\'admin',
      priority: priority || 'medium',
      status: 'pending',
      scheduledAt,
      objectives: objectives || [],
      confidence: 70,
      impactScore: 70,
      clientName: clientName || '',
      dealTitle: dealTitle || '',
      createdAt: new Date(),
      createdBy: `admin_manual_${decodedToken.uid}`,
    };

    const docRef = await adminDb!.collection('tasks').add(taskDoc);

    console.log(`✅ Task created: ${docRef.id}`);

    return NextResponse.json({
      success: true,
      task: {
        id: docRef.id,
        ...taskDoc,
      },
    });

  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
