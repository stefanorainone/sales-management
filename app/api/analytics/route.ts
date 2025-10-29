import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timePeriod = searchParams.get('timePeriod') || 'month';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Calculate date range based on time period
    const now = new Date();
    let startDate = new Date();

    switch (timePeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch activities
    const activitiesSnapshot = await adminDb
      .collection('activities')
      .where('userId', '==', userId)
      .where('createdAt', '>=', startDate)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch clients
    const clientsSnapshot = await adminDb
      .collection('clients')
      .where('userId', '==', userId)
      .get();

    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate activity metrics
    const activityMetrics = calculateActivityMetrics(activities);

    // Calculate conversion funnel
    const conversionFunnel = calculateConversionFunnel(clients);

    // Calculate performance data (for now just current user)
    const performanceData = calculatePerformanceData(activities, clients, userId);

    return NextResponse.json({
      activityMetrics,
      conversionFunnel,
      performanceData,
      timePeriod,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}

function calculateActivityMetrics(activities: any[]) {
  const typeCount: Record<string, number> = {};
  const previousPeriodTypeCount: Record<string, number> = {};

  // Count activities by type
  activities.forEach(activity => {
    const type = activity.type || 'other';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  // Map activity types to Italian labels and set targets
  const typeLabels: Record<string, string> = {
    call: 'Chiamate',
    email: 'Email',
    meeting: 'Meeting',
    demo: 'Demo',
    proposal: 'Proposte Inviate',
    contract: 'Contratti Firmati',
    task: 'Task',
  };

  const targets: Record<string, number> = {
    call: 150,
    email: 100,
    meeting: 30,
    demo: 15,
    proposal: 20,
    contract: 10,
    task: 50,
  };

  // Calculate trend (simplified - using 0 for now as we need historical data)
  const metrics = Object.entries(typeCount).map(([type, count]) => ({
    type: typeLabels[type] || type,
    count,
    trend: 0, // Would need previous period data to calculate real trend
    target: targets[type] || 50,
  }));

  // Add missing types with 0 count
  Object.keys(typeLabels).forEach(type => {
    if (!typeCount[type]) {
      metrics.push({
        type: typeLabels[type],
        count: 0,
        trend: 0,
        target: targets[type] || 50,
      });
    }
  });

  return metrics.sort((a, b) => b.count - a.count);
}

function calculateConversionFunnel(clients: any[]) {
  const statusCount: Record<string, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    customer: 0,
  };

  // Count clients by status
  clients.forEach(client => {
    const status = client.status || 'new';
    if (statusCount[status] !== undefined) {
      statusCount[status]++;
    }
  });

  // Build funnel stages
  const total = clients.length || 1;
  const funnel = [
    {
      stage: 'Lead Acquisiti',
      count: clients.length,
      rate: 100,
    },
    {
      stage: 'Contacted',
      count: statusCount.contacted + statusCount.qualified + statusCount.proposal + statusCount.customer,
      rate: 0,
    },
    {
      stage: 'Qualified',
      count: statusCount.qualified + statusCount.proposal + statusCount.customer,
      rate: 0,
    },
    {
      stage: 'Proposal Sent',
      count: statusCount.proposal + statusCount.customer,
      rate: 0,
    },
    {
      stage: 'Won',
      count: statusCount.customer,
      rate: 0,
    },
  ];

  // Calculate conversion rates
  for (let i = 1; i < funnel.length; i++) {
    if (funnel[i - 1].count > 0) {
      funnel[i].rate = Math.round((funnel[i].count / funnel[i - 1].count) * 100);
    }
  }

  return funnel;
}

function calculatePerformanceData(activities: any[], clients: any[], userId: string) {
  // Count different activity types
  const calls = activities.filter(a => a.type === 'call').length;
  const meetings = activities.filter(a => a.type === 'meeting').length;
  const proposals = activities.filter(a => a.type === 'proposal').length;
  const deals = clients.filter(c => c.status === 'customer').length;
  const qualifiedLeads = clients.filter(c => c.status === 'qualified' || c.status === 'proposal' || c.status === 'customer').length;

  const winRate = qualifiedLeads > 0 ? Math.round((deals / qualifiedLeads) * 100) : 0;

  return [
    {
      seller: 'Tu',
      calls,
      meetings,
      proposals,
      deals,
      winRate,
    },
  ];
}
