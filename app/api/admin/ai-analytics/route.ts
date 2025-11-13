import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminDb } from '@/lib/firebase/admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyticsContext {
  users: any[];
  relationships: any[];
  tasks: any[];
  deals: any[];
  activities: any[];
  timestamp: string;
}

async function buildAnalyticsContext(): Promise<AnalyticsContext> {
  console.log('📊 Building analytics context...');

  // Fetch all users
  const usersSnapshot = await adminDb.collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Fetch all relationships
  const relationshipsSnapshot = await adminDb.collection('relationships').get();
  const relationships = relationshipsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
    lastContact: doc.data().lastContact,
  }));

  // Fetch all tasks
  const tasksSnapshot = await adminDb.collection('tasks').get();
  const tasks = tasksSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    dueDate: doc.data().dueDate?.toDate?.()?.toISOString(),
    completedAt: doc.data().completedAt?.toDate?.()?.toISOString(),
  }));

  // Fetch all deals
  const dealsSnapshot = await adminDb.collection('deals').get();
  const deals = dealsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
    expectedCloseDate: doc.data().expectedCloseDate?.toDate?.()?.toISOString(),
  }));

  // Fetch all activities
  const activitiesSnapshot = await adminDb.collection('activities').get();
  const activities = activitiesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
  }));

  console.log('✅ Context built:', {
    users: users.length,
    relationships: relationships.length,
    tasks: tasks.length,
    deals: deals.length,
    activities: activities.length,
  });

  return {
    users,
    relationships,
    tasks,
    deals,
    activities,
    timestamp: new Date().toISOString(),
  };
}

function buildSystemPrompt(context: AnalyticsContext): string {
  // Calculate stats per user
  const userStats = context.users.map(user => {
    const userRelationships = context.relationships.filter(r => r.userId === user.id);
    const userTasks = context.tasks.filter(t => t.userId === user.id);
    const userDeals = context.deals.filter(d => d.sellerId === user.id);
    const userActivities = context.activities.filter(a => a.userId === user.id);

    return {
      userId: user.id,
      name: user.displayName || user.email,
      email: user.email,
      role: user.role,
      stats: {
        totalRelationships: userRelationships.length,
        strongRelationships: userRelationships.filter(r => r.strength === 'strong').length,
        activeRelationships: userRelationships.filter(r => r.strength === 'active').length,
        criticalRelationships: userRelationships.filter(r => r.importance === 'critical').length,
        balancedRelationships: userRelationships.filter(r => r.valueBalance === 'balanced').length,
        totalActions: userRelationships.reduce((sum, r) => sum + (r.actionsHistory?.length || 0), 0),
        totalNotes: userRelationships.reduce((sum, r) => sum + (r.noteCount || 0), 0),
        totalTasks: userTasks.length,
        completedTasks: userTasks.filter(t => t.status === 'completed').length,
        totalDeals: userDeals.length,
        dealsValue: userDeals.reduce((sum, d) => sum + (d.value || 0), 0),
        wonDeals: userDeals.filter(d => d.stage === 'won').length,
        totalActivities: userActivities.length,
      },
      recentRelationships: userRelationships.slice(0, 5).map(r => ({
        name: r.name,
        company: r.company,
        strength: r.strength,
        importance: r.importance,
        lastContact: r.lastContact,
        actionsCount: r.actionsHistory?.length || 0,
      })),
    };
  });

  return `You are an AI analytics assistant for a sales CRM system. You have access to comprehensive data about all salespeople, their relationships, tasks, deals, and activities.

## Current Data Overview (${context.timestamp}):
- Total Users: ${context.users.length}
- Total Relationships: ${context.relationships.length}
- Total Tasks: ${context.tasks.length}
- Total Deals: ${context.deals.length}
- Total Activities: ${context.activities.length}

## Detailed Stats by Salesperson:
${JSON.stringify(userStats, null, 2)}

## Key Metrics Definitions:
- **Relationship Strength**: strong (consolidata) > active (in contatto) > developing (in sviluppo) > weak (da rafforzare)
- **Relationship Importance**: critical (essenziale) > high > medium > low
- **Value Balance**: balanced (equilibrato), do_give_more (devo dare valore), do_receive_more (sto ricevendo)
- **Relationship Categories**: decision_maker, influencer, champion, gatekeeper, advisor, connector

## Your Role:
When answering questions:
1. Analyze the data comprehensively
2. Provide specific names, numbers, and comparisons
3. Give actionable insights and recommendations
4. Highlight top performers and areas for improvement
5. Use the Ferrazzi "Never Eat Alone" methodology context
6. Be concise but thorough
7. Format responses in markdown for readability

## Example Questions You Can Answer:
- Chi è il venditore che sta lavorando meglio?
- Quali venditori hanno più relazioni strong?
- Chi ha il miglior value balance?
- Chi non sta seguendo le relazioni?
- Analizza le performance degli ultimi 30 giorni
- Confronta i venditori per qualità delle relazioni

Answer in Italian, be specific with data, and provide strategic recommendations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    console.log('🤖 AI Analytics Question:', question);

    // Build context from database
    const context = await buildAnalyticsContext();
    const systemPrompt = buildSystemPrompt(context);

    console.log('📤 Sending to OpenAI...');

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: question,
        },
      ],
    });

    const response = completion.choices[0]?.message?.content || '';

    console.log('✅ AI Response generated');

    return NextResponse.json({
      question,
      answer: response,
      timestamp: new Date().toISOString(),
      context: {
        users: context.users.length,
        relationships: context.relationships.length,
        tasks: context.tasks.length,
        deals: context.deals.length,
        activities: context.activities.length,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in AI Analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate AI analysis',
        details: error.message
      },
      { status: 500 }
    );
  }
}
