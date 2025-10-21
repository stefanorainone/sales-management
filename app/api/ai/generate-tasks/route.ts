import { NextRequest, NextResponse } from 'next/server';
import { generateDailyTasks } from '@/lib/ai/openai';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sellerId } = await request.json();

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId is required' },
        { status: 400 }
      );
    }

    // Fetch seller data from Firestore
    const sellerDoc = await adminDb!.collection('users').doc(sellerId).get();
    if (!sellerDoc.exists) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const seller = sellerDoc.data();

    // Fetch recent activities
    const activitiesSnapshot = await adminDb!
      .collection('activities')
      .where('assignedTo', '==', sellerId)
      .where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .get();

    const activities = activitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch active deals
    const dealsSnapshot = await adminDb!
      .collection('deals')
      .where('assignedTo', '==', sellerId)
      .where('stage', 'not-in', ['won', 'lost'])
      .get();

    const deals = dealsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch inactive leads (>3 days without contact)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const leadsSnapshot = await adminDb!
      .collection('clients')
      .where('assignedTo', '==', sellerId)
      .where('lastContactedAt', '<', threeDaysAgo)
      .limit(20)
      .get();

    const inactiveLeads = leadsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch historical metrics (mock for now)
    const historicalMetrics = {
      last30Days: {
        calls: 45,
        meetings: 12,
        dealsWon: 3,
        conversionRate: 0.65,
        avgResponseTime: 1.5, // hours
      },
    };

    // Generate tasks using Claude
    const tasks = await generateDailyTasks({
      sellerId,
      sellerName: seller?.displayName || 'Unknown',
      activities,
      deals,
      inactiveLeads,
      historicalMetrics,
      goals: {
        revenue: 50,
        deals: 20,
        activities: 100,
      },
    });

    // Save generated tasks to Firestore
    const batch = adminDb!.batch();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    tasks.forEach((task) => {
      const taskRef = adminDb!.collection('ai_tasks').doc();
      batch.set(taskRef, {
        ...task,
        sellerId,
        status: 'pending',
        createdAt: new Date(),
        scheduledFor: tomorrow,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      tasksGenerated: tasks.length,
      tasks,
    });
  } catch (error: any) {
    console.error('Error generating AI tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to trigger for all sellers (cron job)
export async function GET(request: NextRequest) {
  try {
    // Get all active sellers
    const sellersSnapshot = await adminDb!
      .collection('users')
      .where('role', '==', 'seller')
      .get();

    const results = [];

    for (const sellerDoc of sellersSnapshot.docs) {
      try {
        // Call POST endpoint logic for each seller
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-tasks`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerId: sellerDoc.id }),
          }
        );

        const data = await response.json();
        results.push({
          sellerId: sellerDoc.id,
          success: data.success,
          tasksGenerated: data.tasksGenerated,
        });
      } catch (error: any) {
        results.push({
          sellerId: sellerDoc.id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedSellers: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Error in batch AI task generation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
