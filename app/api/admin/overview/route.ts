import { NextRequest, NextResponse } from 'next/server';
import type { AdminDashboardData, AdminSellerOverview, User, Deal, AITask } from '@/types';

// Mock data - in production, fetch from database
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'mario.rossi@vr.com',
    displayName: 'Mario Rossi',
    role: 'seller',
    avatar: 'https://i.pravatar.cc/150?img=1',
    territory: 'Nord Italia',
    team: 'Team Alpha',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
  },
  {
    id: 'user-2',
    email: 'luca.bianchi@vr.com',
    displayName: 'Luca Bianchi',
    role: 'seller',
    avatar: 'https://i.pravatar.cc/150?img=2',
    territory: 'Centro Italia',
    team: 'Team Alpha',
    createdAt: new Date('2024-02-10'),
    lastLogin: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: 'user-3',
    email: 'sara.verdi@vr.com',
    displayName: 'Sara Verdi',
    role: 'seller',
    avatar: 'https://i.pravatar.cc/150?img=3',
    territory: 'Sud Italia',
    team: 'Team Beta',
    createdAt: new Date('2024-03-05'),
    lastLogin: new Date(Date.now() - 7200000), // 2 hours ago
  },
];

// Mock deals per user
const mockDealsPerUser: Record<string, Deal[]> = {
  'user-1': [
    {
      id: 'deal-1',
      userId: 'user-1',
      clientId: 'client-1',
      clientName: 'Liceo Da Vinci',
      entityType: 'scuola',
      stage: 'proposal_sent',
      priority: 'hot',
      serviceType: 'evento_scuola',
      contractType: 'evento_singolo',
      probability: 85,
      createdAt: new Date('2025-09-15').toISOString(),
      updatedAt: new Date('2025-10-15').toISOString(),
      title: 'Evento VR Scientifico - 250 studenti',
    },
    {
      id: 'deal-2',
      userId: 'user-1',
      clientId: 'client-2',
      clientName: 'Grand Hotel Vesuvio',
      entityType: 'hotel',
      stage: 'verbal_agreement',
      priority: 'hot',
      serviceType: 'postazione_hotel',
      contractType: 'abbonamento_annuale',
      probability: 90,
      createdAt: new Date('2025-09-20').toISOString(),
      updatedAt: new Date('2025-10-16').toISOString(),
      title: 'Postazione VR Lobby',
    },
    {
      id: 'deal-3',
      userId: 'user-1',
      clientId: 'client-3',
      clientName: 'Comune di Assisi',
      entityType: 'comune',
      stage: 'under_review',
      priority: 'warm',
      serviceType: 'esperienza_comune',
      contractType: 'sviluppo_custom',
      probability: 80,
      createdAt: new Date('2025-08-10').toISOString(),
      updatedAt: new Date('2025-10-14').toISOString(),
      title: 'Esperienza 360 Basiliche + Postazione',
    },
  ],
  'user-2': [
    {
      id: 'deal-4',
      userId: 'user-2',
      clientId: 'client-4',
      clientName: 'Hotel Roma Palace',
      entityType: 'hotel',
      stage: 'meeting_scheduled',
      priority: 'warm',
      serviceType: 'postazione_hotel',
      contractType: 'abbonamento_annuale',
      probability: 70,
      createdAt: new Date('2025-09-25').toISOString(),
      updatedAt: new Date('2025-10-10').toISOString(),
      title: 'Postazione VR Reception',
    },
    {
      id: 'deal-5',
      userId: 'user-2',
      clientId: 'client-5',
      clientName: 'Comune di Siena',
      entityType: 'comune',
      stage: 'won',
      priority: 'hot',
      serviceType: 'esperienza_comune',
      contractType: 'sviluppo_custom',
      probability: 100,
      createdAt: new Date('2025-07-15').toISOString(),
      updatedAt: new Date('2025-10-12').toISOString(),
      closedDate: new Date('2025-10-12').toISOString(),
      title: 'Esperienza 360 Palio + InfoPoint',
    },
  ],
  'user-3': [
    {
      id: 'deal-6',
      userId: 'user-3',
      clientId: 'client-6',
      clientName: 'Hotel Positano Luxury',
      entityType: 'hotel',
      stage: 'won',
      priority: 'hot',
      serviceType: 'postazione_hotel',
      contractType: 'abbonamento_annuale',
      probability: 100,
      createdAt: new Date('2025-08-20').toISOString(),
      updatedAt: new Date('2025-10-08').toISOString(),
      closedDate: new Date('2025-10-08').toISOString(),
      title: 'Postazione VR Terrazza',
    },
    {
      id: 'deal-7',
      userId: 'user-3',
      clientId: 'client-7',
      clientName: 'Hotel Amalfi Coast',
      entityType: 'hotel',
      stage: 'won',
      priority: 'hot',
      serviceType: 'postazione_hotel',
      contractType: 'abbonamento_annuale',
      probability: 100,
      createdAt: new Date('2025-09-01').toISOString(),
      updatedAt: new Date('2025-10-14').toISOString(),
      closedDate: new Date('2025-10-14').toISOString(),
      title: 'Postazione VR Lobby',
    },
    {
      id: 'deal-8',
      userId: 'user-3',
      clientId: 'client-8',
      clientName: 'Grand Hotel Sorrento',
      entityType: 'hotel',
      stage: 'won',
      priority: 'hot',
      serviceType: 'postazione_hotel',
      contractType: 'abbonamento_annuale',
      probability: 100,
      createdAt: new Date('2025-09-10').toISOString(),
      updatedAt: new Date('2025-10-16').toISOString(),
      closedDate: new Date('2025-10-16').toISOString(),
      title: 'Postazione VR Suite',
    },
  ],
};

// Mock tasks per user
const mockTasksPerUser: Record<string, AITask[]> = {
  'user-1': [
    {
      id: 'task-1',
      userId: 'user-1',
      type: 'call',
      title: 'Follow-up Liceo Da Vinci',
      description: 'Chiamata a Preside per status approvazione',
      aiRationale: 'Proposta inviata 7 giorni fa',
      priority: 'high',
      status: 'pending',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      confidence: 85,
      impactScore: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      userId: 'user-1',
      type: 'call',
      title: 'Preparazione contratto Grand Hotel Vesuvio',
      description: 'Call con GM per definire dettagli',
      aiRationale: 'Accordo verbale ottenuto',
      priority: 'critical',
      status: 'in_progress',
      scheduledAt: new Date().toISOString(),
      confidence: 90,
      impactScore: 95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  'user-2': [
    {
      id: 'task-3',
      userId: 'user-2',
      type: 'meeting',
      title: 'Demo Hotel Roma Palace',
      description: 'Presentazione VR experience',
      aiRationale: 'Meeting schedulato',
      priority: 'high',
      status: 'pending',
      scheduledAt: new Date(Date.now() + 7200000).toISOString(),
      confidence: 70,
      impactScore: 80,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  'user-3': [
    {
      id: 'task-4',
      userId: 'user-3',
      type: 'follow_up',
      title: 'Follow-up installazione Positano',
      description: 'Verifica installazione completata',
      aiRationale: 'Deal chiuso, verificare installazione',
      priority: 'medium',
      status: 'completed',
      scheduledAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      confidence: 95,
      impactScore: 70,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    // In production, verify admin role from session

    const sellers: AdminSellerOverview[] = mockUsers
      .filter((user) => user.role === 'seller')
      .map((user) => {
        const deals = mockDealsPerUser[user.id] || [];
        const tasks = mockTasksPerUser[user.id] || [];

        const activeDeals = deals.filter(
          (d) => d.stage !== 'won' && d.stage !== 'lost' && d.stage !== 'active'
        ).length;

        const dealsWon = deals.filter((d) => d.stage === 'won').length;

        const tasksToday = tasks.filter((t) => {
          const taskDate = new Date(t.scheduledAt);
          const today = new Date();
          return taskDate.toDateString() === today.toDateString();
        }).length;

        const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;

        const lastActivity = tasks.length > 0 ? tasks[0].updatedAt : undefined;

        return {
          user,
          stats: {
            activeDeals,
            dealsWon,
            tasksToday,
            tasksCompleted,
            lastActivity,
          },
          recentDeals: deals.slice(0, 3),
          todayTasks: tasks.filter((t) => {
            const taskDate = new Date(t.scheduledAt);
            const today = new Date();
            return taskDate.toDateString() === today.toDateString();
          }),
          customInstructions: [], // Will be fetched from instructions API
        };
      });

    // Calculate team stats
    const allDeals = Object.values(mockDealsPerUser).flat();
    const teamStats = {
      totalDeals: allDeals.filter(
        (d) => d.stage !== 'won' && d.stage !== 'lost' && d.stage !== 'active'
      ).length,
      dealsWon: allDeals.filter((d) => d.stage === 'won').length,
      avgWinRate:
        allDeals.length > 0
          ? (allDeals.filter((d) => d.stage === 'won').length / allDeals.length) * 100
          : 0,
      totalRevenue: allDeals
        .filter((d) => d.stage === 'won' && d.contractValue)
        .reduce((sum, d) => sum + (d.contractValue || 0), 0),
    };

    const response: AdminDashboardData = {
      sellers,
      teamStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    return NextResponse.json({ error: 'Failed to fetch admin overview' }, { status: 500 });
  }
}
