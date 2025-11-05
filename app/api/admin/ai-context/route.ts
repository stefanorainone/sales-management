import { NextRequest, NextResponse } from 'next/server';
import { getAIContext, updateCustomContext } from '@/lib/services/ai-context-service';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET /api/admin/ai-context?userId=xxx
 * Recupera il contesto AI per modifiche admin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Se non viene passato userId, restituisci lista di tutti i venditori con contesto
      const contextsSnapshot = await adminDb!.collection('aiContexts').get();

      const contexts = contextsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          sellerName: data.sellerName || 'Sconosciuto',
          totalTasks: data.stats?.totalTasksCompleted || 0,
          successRate: data.stats?.successRate || 0,
          lastUpdated: data.updatedAt || data.createdAt,
        };
      });

      return NextResponse.json(contexts);
    }

    const context = await getAIContext(userId);

    if (!context) {
      // Crea un contesto vuoto se non esiste
      return NextResponse.json({
        userId,
        sellerName: '',
        completedTasks: [],
        stats: {
          totalTasksCompleted: 0,
          successRate: 0,
          averageDuration: 0,
          commonObjections: [],
          bestPerformingTactics: [],
        },
        customContext: {
          sellerStrengths: [],
          sellerWeaknesses: [],
          learningGoals: [],
          specificInstructions: '',
          communicationStyle: 'Professionale e di supporto',
          industryKnowledge: '',
          companyGuidelines: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 0,
      });
    }

    return NextResponse.json(context);
  } catch (error: any) {
    console.error('Error fetching AI context for admin:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-context
 * Aggiorna il contesto personalizzato dall'admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sellerName, customContext } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    await updateCustomContext(userId, sellerName, customContext);

    return NextResponse.json({
      success: true,
      message: 'Contesto AI aggiornato con successo',
    });
  } catch (error: any) {
    console.error('Error updating AI context:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
