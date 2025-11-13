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

    // Fetch activities (filter by time period in memory to avoid index requirement)
    const activitiesSnapshot = await adminDb
      .collection('activities')
      .where('userId', '==', userId)
      .get();

    const allActivities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Filter by date in memory
    const activities = allActivities.filter(activity => {
      const createdAt = activity.createdAt?._seconds
        ? new Date(activity.createdAt._seconds * 1000)
        : new Date(activity.createdAt);
      return createdAt >= startDate;
    });

    // Fetch clients
    const clientsSnapshot = await adminDb
      .collection('clients')
      .where('userId', '==', userId)
      .get();

    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch tasks (for completion metrics, filter by time period in memory)
    const tasksSnapshot = await adminDb
      .collection('tasks')
      .where('userId', '==', userId)
      .get();

    const allTasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Filter by date in memory
    const tasks = allTasks.filter(task => {
      const createdAt = task.createdAt?._seconds
        ? new Date(task.createdAt._seconds * 1000)
        : new Date(task.createdAt);
      return createdAt >= startDate;
    });

    // Fetch relationships (for network health)
    const relationshipsSnapshot = await adminDb
      .collection('relationships')
      .where('userId', '==', userId)
      .get();

    const relationships = relationshipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate activity metrics
    const activityMetrics = calculateActivityMetrics(activities);

    // Calculate conversion funnel
    const conversionFunnel = calculateConversionFunnel(clients);

    // Calculate performance data (for now just current user)
    const performanceData = calculatePerformanceData(activities, clients, userId);

    // Calculate additional useful metrics
    const taskMetrics = calculateTaskMetrics(tasks);
    const relationshipMetrics = calculateRelationshipMetrics(relationships);
    const relationshipActivityMetrics = calculateRelationshipActivityMetrics(relationships, startDate);
    const dailyTimeInvestment = calculateDailyTimeInvestment(allTasks, startDate, now);

    return NextResponse.json({
      activityMetrics,
      conversionFunnel,
      performanceData,
      taskMetrics,
      relationshipMetrics,
      relationshipActivityMetrics,
      dailyTimeInvestment,
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

function calculateTaskMetrics(tasks: any[]) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate average completion time (if available)
  const completedWithTimes = tasks.filter(t =>
    t.status === 'completed' && t.completedAt && t.createdAt
  );

  let avgCompletionHours = 0;
  if (completedWithTimes.length > 0) {
    const totalHours = completedWithTimes.reduce((sum, task) => {
      const created = task.createdAt?._seconds
        ? new Date(task.createdAt._seconds * 1000)
        : new Date(task.createdAt);
      const completed = task.completedAt?._seconds
        ? new Date(task.completedAt._seconds * 1000)
        : new Date(task.completedAt);
      const hours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    avgCompletionHours = Math.round(totalHours / completedWithTimes.length);
  }

  return {
    total,
    completed,
    pending,
    inProgress,
    completionRate,
    avgCompletionHours,
  };
}

function calculateRelationshipMetrics(relationships: any[]) {
  const total = relationships.length;

  // Count by strength
  const strongCount = relationships.filter(r => r.strength === 'strong').length;
  const activeCount = relationships.filter(r => r.strength === 'active').length;
  const developingCount = relationships.filter(r => r.strength === 'developing').length;
  const weakCount = relationships.filter(r => r.strength === 'weak').length;
  const prospectiveCount = relationships.filter(r => r.strength === 'prospective').length;

  // Count by category
  const decisionMakers = relationships.filter(r => r.category === 'decision_maker').length;
  const champions = relationships.filter(r => r.category === 'champion').length;
  const influencers = relationships.filter(r => r.category === 'influencer').length;
  const advisors = relationships.filter(r => r.category === 'advisor').length;
  const connectors = relationships.filter(r => r.category === 'connector').length;
  const gatekeepers = relationships.filter(r => r.category === 'gatekeeper').length;

  // Network health score (0-100)
  // Strong relationships are worth more, prospective less
  const healthScore = total > 0
    ? Math.round(((strongCount * 5 + activeCount * 4 + developingCount * 3 + weakCount * 2 + prospectiveCount * 1) / (total * 5)) * 100)
    : 0;

  return {
    total,
    byStrength: {
      strong: strongCount,
      active: activeCount,
      developing: developingCount,
      weak: weakCount,
      prospective: prospectiveCount,
    },
    byCategory: {
      decision_maker: decisionMakers,
      champion: champions,
      influencer: influencers,
      advisor: advisors,
      connector: connectors,
      gatekeeper: gatekeepers,
    },
    healthScore,
  };
}

function calculateRelationshipActivityMetrics(relationships: any[], startDate: Date) {
  // Analizza le attività completate per mantenere le relazioni
  const metricsData: any[] = [];

  relationships.forEach(rel => {
    const actions = rel.actionsHistory || [];

    // Filtra azioni nel periodo selezionato
    const recentActions = actions.filter((action: any) => {
      const actionDate = action.completedAt?._seconds
        ? new Date(action.completedAt._seconds * 1000)
        : new Date(action.completedAt);
      return actionDate >= startDate;
    });

    if (recentActions.length > 0 || rel.strength === 'weak' || rel.strength === 'prospective') {
      // Calcola giorni dall'ultimo contatto
      let daysSinceLastContact = 0;
      if (rel.lastContact) {
        const lastContactDate = rel.lastContact?._seconds
          ? new Date(rel.lastContact._seconds * 1000)
          : new Date(rel.lastContact);
        const diffTime = Math.abs(new Date().getTime() - lastContactDate.getTime());
        daysSinceLastContact = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      metricsData.push({
        relationshipId: rel.id,
        name: rel.name,
        company: rel.company,
        strength: rel.strength,
        importance: rel.importance,
        category: rel.category,
        actionsInPeriod: recentActions.length,
        totalActions: actions.length,
        daysSinceLastContact,
        lastAction: recentActions.length > 0
          ? recentActions[recentActions.length - 1].action
          : null,
        nextAction: rel.nextAction || null,
        needsAttention: daysSinceLastContact > 30 || rel.strength === 'weak' || rel.strength === 'prospective',
      });
    }
  });

  // Ordina per priorità (relazioni che necessitano attenzione)
  metricsData.sort((a, b) => {
    if (a.needsAttention && !b.needsAttention) return -1;
    if (!a.needsAttention && b.needsAttention) return 1;
    return b.daysSinceLastContact - a.daysSinceLastContact;
  });

  // Statistiche aggregate
  const totalActionsInPeriod = metricsData.reduce((sum, m) => sum + m.actionsInPeriod, 0);
  const relationshipsNeedingAttention = metricsData.filter(m => m.needsAttention).length;
  const avgActionsPerRelationship = metricsData.length > 0
    ? Math.round(totalActionsInPeriod / metricsData.length)
    : 0;

  // Top 10 relazioni più attive
  const topActive = [...metricsData]
    .sort((a, b) => b.actionsInPeriod - a.actionsInPeriod)
    .slice(0, 10);

  return {
    summary: {
      totalActionsInPeriod,
      relationshipsNeedingAttention,
      avgActionsPerRelationship,
      totalTrackedRelationships: metricsData.length,
    },
    topActiveRelationships: topActive,
    allRelationships: metricsData,
  };
}

function calculateDailyTimeInvestment(tasks: any[], startDate: Date, endDate: Date) {
  // Crea un map per aggregare il tempo per ogni giorno
  const dailyTimeMap: Record<string, number> = {};

  // Filtra task completati con actualDuration nel periodo
  const completedTasks = tasks.filter(task => {
    if (task.status !== 'completed' || !task.completedAt || !task.actualDuration) {
      return false;
    }

    const completedAt = task.completedAt?._seconds
      ? new Date(task.completedAt._seconds * 1000)
      : new Date(task.completedAt);

    return completedAt >= startDate && completedAt <= endDate;
  });

  // Aggrega tempo per giorno
  completedTasks.forEach(task => {
    const completedAt = task.completedAt?._seconds
      ? new Date(task.completedAt._seconds * 1000)
      : new Date(task.completedAt);

    // Formato YYYY-MM-DD per il giorno
    const dayKey = completedAt.toISOString().split('T')[0];

    if (!dailyTimeMap[dayKey]) {
      dailyTimeMap[dayKey] = 0;
    }

    dailyTimeMap[dayKey] += task.actualDuration || 0;
  });

  // Converti il map in array ordinato per data
  const dailyData = Object.entries(dailyTimeMap)
    .map(([date, minutes]) => ({
      date,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10, // Arrotonda a 1 decimale
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calcola statistiche
  const totalMinutes = Object.values(dailyTimeMap).reduce((sum, min) => sum + min, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgMinutesPerDay = dailyData.length > 0
    ? Math.round(totalMinutes / dailyData.length)
    : 0;
  const avgHoursPerDay = Math.round((avgMinutesPerDay / 60) * 10) / 10;

  return {
    dailyData,
    summary: {
      totalMinutes,
      totalHours,
      avgMinutesPerDay,
      avgHoursPerDay,
      daysWithActivity: dailyData.length,
      totalCompletedTasks: completedTasks.length,
    },
  };
}
