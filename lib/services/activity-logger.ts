import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'task_deleted'
  | 'relationship_created'
  | 'relationship_updated'
  | 'relationship_deleted'
  | 'action_completed'
  | 'note_added'
  | 'briefing_generated';

export type EntityType = 'task' | 'relationship' | 'auth' | 'note' | 'briefing';

export interface ActivityLog {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'admin' | 'seller';
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details: any;
  timestamp: Timestamp;
  metadata?: any;
}

/**
 * Log an activity to Firestore
 */
export async function logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
  try {
    if (!adminDb) {
      console.error('[Activity Logger] Admin DB not initialized');
      return null;
    }

    const activityData = {
      ...activity,
      timestamp: Timestamp.now(),
    };

    const docRef = await adminDb.collection('activities').add(activityData);
    console.log(`[Activity Logger] Logged activity: ${activity.action} by ${activity.userName}`);

    return docRef.id;
  } catch (error) {
    console.error('[Activity Logger] Error logging activity:', error);
    return null;
  }
}

/**
 * Normalize old activity format to new format
 */
function normalizeActivity(doc: any): any {
  const data = doc.data();

  // New format - already has action, entityType, timestamp
  if (data.action && data.timestamp) {
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }

  // Old format - has type, createdAt (needs conversion)
  if (data.type && data.createdAt) {
    // Map old type to new action
    const actionMap: Record<string, string> = {
      'call': 'call_completed',
      'email': 'email_sent',
      'meeting': 'meeting_completed',
      'demo': 'demo_completed',
      'follow_up': 'follow_up_completed',
      'research': 'research_completed',
      'admin': 'admin_task_completed',
    };

    return {
      id: doc.id,
      userId: data.userId,
      action: actionMap[data.type] || data.type,
      entityType: data.type, // Use type as entityType
      entityName: data.title,
      userName: 'Venditore', // Default name for old records
      userEmail: '',
      userRole: 'seller',
      details: {
        title: data.title,
        description: data.description,
        outcome: data.outcome,
        duration: data.duration,
        legacy: true, // Flag to indicate old format
      },
      timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }

  // Unknown format - return as is with default timestamp
  return {
    id: doc.id,
    ...data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get activities with filters
 */
export async function getActivities(options: {
  userId?: string;
  action?: ActivityAction;
  entityType?: EntityType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    if (!adminDb) {
      throw new Error('Admin DB not initialized');
    }

    // Get ALL activities without ordering (to support both old and new formats)
    let query = adminDb.collection('activities');

    // Only apply userId filter if specified (most common filter)
    if (options.userId) {
      query = query.where('userId', '==', options.userId) as any;
    }

    const snapshot = await query.get();

    // Normalize all activities to new format
    let activities = snapshot.docs.map(doc => normalizeActivity(doc));

    // Apply filters in memory (since old and new formats have different fields)
    if (options.action) {
      activities = activities.filter(a => a.action === options.action);
    }
    if (options.entityType) {
      activities = activities.filter(a => a.entityType === options.entityType);
    }
    if (options.startDate) {
      const startTime = options.startDate.getTime();
      activities = activities.filter(a => new Date(a.timestamp).getTime() >= startTime);
    }
    if (options.endDate) {
      const endTime = options.endDate.getTime();
      activities = activities.filter(a => new Date(a.timestamp).getTime() <= endTime);
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination in memory
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    activities = activities.slice(offset, offset + limit);

    return activities;
  } catch (error) {
    console.error('[Activity Logger] Error getting activities:', error);
    throw error;
  }
}

/**
 * Get activity stats
 */
export async function getActivityStats(userId?: string) {
  try {
    if (!adminDb) {
      throw new Error('Admin DB not initialized');
    }

    let query = adminDb.collection('activities');

    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }

    const snapshot = await query.get();

    // Normalize all activities first
    const normalizedActivities = snapshot.docs.map(doc => normalizeActivity(doc));

    const stats = {
      total: normalizedActivities.length,
      byAction: {} as Record<string, number>,
      byEntityType: {} as Record<string, number>,
      byUser: {} as Record<string, { count: number; userName: string; userEmail: string }>,
    };

    normalizedActivities.forEach(activity => {
      // Count by action
      if (activity.action) {
        stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1;
      }

      // Count by entity type
      if (activity.entityType) {
        stats.byEntityType[activity.entityType] = (stats.byEntityType[activity.entityType] || 0) + 1;
      }

      // Count by user
      if (activity.userId) {
        if (!stats.byUser[activity.userId]) {
          stats.byUser[activity.userId] = {
            count: 0,
            userName: activity.userName || 'Sconosciuto',
            userEmail: activity.userEmail || '',
          };
        }
        stats.byUser[activity.userId].count++;
      }
    });

    return stats;
  } catch (error) {
    console.error('[Activity Logger] Error getting stats:', error);
    throw error;
  }
}
