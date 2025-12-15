import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

/**
 * POST /api/seller/tasks
 * Crea un nuovo task personale per il venditore autenticato
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verifica autenticazione
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;

    // 2. Verifica che l'utente esista e abbia un ruolo valido
    const userDoc = await adminDb!.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (!userData || !['seller', 'admin', 'team_leader'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse e validazione body
    const body = await req.json();
    const { title, type, scheduledAt, notes } = body;

    // Validazione titolo
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'Titolo obbligatorio' },
        { status: 400 }
      );
    }

    // Validazione tipo
    const validTypes = ['call', 'email', 'meeting', 'demo', 'follow_up', 'research', 'admin'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo task non valido' },
        { status: 400 }
      );
    }

    // Validazione scheduledAt
    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Data/ora obbligatoria' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Data/ora non valida' },
        { status: 400 }
      );
    }

    // 4. Crea il documento task
    const now = new Date();
    const taskDoc = {
      userId,
      type,
      title: title.trim(),
      description: notes?.trim() || '',
      notes: notes?.trim() || '',
      priority: 'medium' as const,
      status: 'pending' as const,
      scheduledAt: scheduledDate.toISOString(),
      createdAt: now,
      updatedAt: now,
      createdBy: `manual_${userId}`,
      clientId: null,
      clientName: '',
      dealId: null,
      dealTitle: '',
      aiRationale: 'Task creato manualmente dal venditore',
      objectives: [],
      estimatedDuration: 15,
    };

    console.log(`[Seller Tasks API] Creating task for user ${userId}:`, {
      title: taskDoc.title,
      type: taskDoc.type,
      scheduledAt: taskDoc.scheduledAt,
    });

    // 5. Salva in Firestore
    const docRef = await adminDb!.collection('tasks').add(taskDoc);

    console.log(`[Seller Tasks API] Task created successfully: ${docRef.id}`);

    // 6. Rispondi con il task creato
    return NextResponse.json({
      success: true,
      task: {
        id: docRef.id,
        ...taskDoc,
        createdAt: taskDoc.createdAt.toISOString(),
        updatedAt: taskDoc.updatedAt.toISOString(),
      },
    });

  } catch (error: unknown) {
    console.error('[Seller Tasks API] Error creating task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Errore interno del server', details: errorMessage },
      { status: 500 }
    );
  }
}
