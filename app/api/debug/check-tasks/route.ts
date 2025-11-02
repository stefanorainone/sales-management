import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const result: any = {
      users: [],
      tasks: [],
      tasksByUser: {},
      stefano: null
    };

    // Get all users
    const usersSnapshot = await adminDb!.collection('users').get();
    result.users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().displayName,
      email: doc.data().email,
      role: doc.data().role
    }));

    // Get all tasks
    const tasksSnapshot = await adminDb!.collection('tasks').get();
    result.tasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        status: data.status,
        type: data.type,
        createdAt: data.createdAt,
        scheduledAt: data.scheduledAt,
        createdBy: data.createdBy
      };
    });

    // Group tasks by user
    result.tasks.forEach((task: any) => {
      if (!result.tasksByUser[task.userId]) {
        result.tasksByUser[task.userId] = [];
      }
      result.tasksByUser[task.userId].push(task);
    });

    // Find Stefano
    const stefano = result.users.find((u: any) =>
      u.name?.toLowerCase().includes('stefano') ||
      u.email?.toLowerCase().includes('stefano')
    );

    if (stefano) {
      result.stefano = {
        user: stefano,
        tasks: result.tasksByUser[stefano.id] || [],
        taskCount: (result.tasksByUser[stefano.id] || []).length
      };
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error checking tasks:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
