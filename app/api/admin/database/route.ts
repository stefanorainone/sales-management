import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

/**
 * GET /api/admin/database
 * Ritorna una vista completa del database per l'admin
 * Include: users, deals, clients, tasks, activities
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

    console.log('📊 Fetching complete database overview...');

    // Ottieni tutti gli utenti
    const usersSnapshot = await adminDb!.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Rimuovi dati sensibili
      password: undefined,
    })) as any[];

    // Ottieni tutti i deals
    const dealsSnapshot = await adminDb!.collection('deals').get();
    const deals = dealsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as any[];

    // Ottieni tutti i clienti
    const clientsSnapshot = await adminDb!.collection('clients').get();
    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as any[];

    // Ottieni tutti i task
    const tasksSnapshot = await adminDb!.collection('tasks').get();
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      scheduledAt: doc.data().scheduledAt || new Date().toISOString(),
    })) as any[];

    // Ottieni tutte le attività recenti (ultimi 90 giorni)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const activitiesSnapshot = await adminDb!
      .collection('activities')
      .where('createdAt', '>=', ninetyDaysAgo)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as any[];

    // Calcola statistiche
    const stats = {
      totalUsers: users.length,
      sellers: users.filter(u => u.role === 'seller' || u.role === 'team_leader').length,
      admins: users.filter(u => u.role === 'admin').length,

      totalDeals: deals.length,
      dealsByStage: deals.reduce((acc, deal) => {
        acc[deal.stage] = (acc[deal.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalDealValue: deals.reduce((sum, deal) => sum + (deal.contractValue || 0), 0),

      totalClients: clients.length,
      clientsByType: clients.reduce((acc, client) => {
        acc[client.entityType] = (acc[client.entityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      totalTasks: tasks.length,
      tasksByStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      totalActivities: activities.length,
      activitiesByType: activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // Attività per venditore
    const sellerActivities = users
      .filter(u => u.role === 'seller' || u.role === 'team_leader')
      .map(seller => {
        const sellerDeals = deals.filter(d => d.userId === seller.id);
        const sellerTasks = tasks.filter(t => t.userId === seller.id);
        const sellerActivitiesCount = activities.filter(a => a.userId === seller.id).length;

        return {
          sellerId: seller.id,
          sellerName: seller.displayName || seller.email,
          sellerEmail: seller.email,
          dealsCount: sellerDeals.length,
          activeDeals: sellerDeals.filter(d => !['lost', 'won'].includes(d.stage)).length,
          wonDeals: sellerDeals.filter(d => d.stage === 'won').length,
          totalValue: sellerDeals.reduce((sum, d) => sum + (d.contractValue || 0), 0),
          tasksCount: sellerTasks.length,
          pendingTasks: sellerTasks.filter(t => t.status === 'pending').length,
          completedTasks: sellerTasks.filter(t => t.status === 'completed').length,
          activitiesCount: sellerActivitiesCount,
        };
      });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      sellerActivities,
      data: {
        users,
        deals,
        clients,
        tasks,
        activities,
      },
    });

  } catch (error: any) {
    console.error('Error fetching database:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
