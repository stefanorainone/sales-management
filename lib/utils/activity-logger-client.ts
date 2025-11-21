import { auth } from '@/lib/firebase/config';

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

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  details?: any;
  metadata?: any;
}

/**
 * Log an activity from the client side
 */
export async function logActivityClient(params: LogActivityParams) {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('[Activity Logger Client] No auth token available');
      return;
    }

    const response = await fetch('/api/log-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('[Activity Logger Client] Failed to log activity:', await response.text());
    }
  } catch (error) {
    console.error('[Activity Logger Client] Error logging activity:', error);
  }
}
