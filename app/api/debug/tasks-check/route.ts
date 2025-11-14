import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug Tasks Check\n');

    // 1. Get all users
    const usersSnapshot = await adminDb!.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName,
      role: doc.data().role,
    }));

    console.log(`Found ${users.length} users`);

    // 2. Find Flavio
    const flavio = users.find(u =>
      u.email?.toLowerCase().includes('flavio') ||
      u.displayName?.toLowerCase().includes('flavio') ||
      u.email?.toLowerCase().includes('carbonaro')
    );

    if (!flavio) {
      return NextResponse.json({
        error: 'Flavio not found',
        users: users.map(u => ({ email: u.email, displayName: u.displayName, id: u.id }))
      });
    }

    console.log(`Found Flavio: ${flavio.email} (ID: ${flavio.id})`);

    // 3. Get all tasks for Flavio
    const allTasksSnapshot = await adminDb!.collection('tasks')
      .where('userId', '==', flavio.id)
      .get();

    const allTasks = allTasksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        status: data.status,
        priority: data.priority,
        userId: data.userId,
        scheduledAt: data.scheduledAt?.toDate?.()?.toISOString() || data.scheduledAt,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });

    // 4. Get pending tasks only
    const pendingTasksSnapshot = await adminDb!.collection('tasks')
      .where('userId', '==', flavio.id)
      .where('status', '==', 'pending')
      .get();

    const pendingTasks = pendingTasksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        status: data.status,
        scheduledAt: data.scheduledAt?.toDate?.()?.toISOString() || data.scheduledAt,
      };
    });

    // 5. Get ALL tasks in the database
    const globalTasksSnapshot = await adminDb!.collection('tasks').get();
    const tasksByUser: { [key: string]: any[] } = {};

    globalTasksSnapshot.docs.forEach(doc => {
      const userId = doc.data().userId;
      if (!tasksByUser[userId]) {
        tasksByUser[userId] = [];
      }
      tasksByUser[userId].push({
        id: doc.id,
        title: doc.data().title,
        status: doc.data().status,
      });
    });

    return NextResponse.json({
      success: true,
      flavio: {
        id: flavio.id,
        email: flavio.email,
        displayName: flavio.displayName,
      },
      allTasksForFlavio: {
        count: allTasks.length,
        tasks: allTasks,
      },
      pendingTasksForFlavio: {
        count: pendingTasks.length,
        tasks: pendingTasks,
      },
      allUsers: users.map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        taskCount: tasksByUser[u.id]?.length || 0,
      })),
      tasksByUser: Object.fromEntries(
        Object.entries(tasksByUser).map(([userId, tasks]) => {
          const user = users.find(u => u.id === userId);
          return [
            userId,
            {
              user: user?.displayName || user?.email || 'Unknown',
              tasks: tasks,
            }
          ];
        })
      ),
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
