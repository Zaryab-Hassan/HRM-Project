/**
 * Activity Logger Utility
 * 
 * This utility provides functions to log user activities throughout the HRM system.
 * It sends activity data to the activity-logs API endpoint.
 */

// Available activity actions
export type ActivityAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'download' | 'approve' | 'reject';

// Available system modules
export type SystemModule = 
  'profile' | 'attendance' | 'payroll' | 'leave' | 
  'employee' | 'settings' | 'loan' | 'notification' | 
  'dashboard' | 'reports' | 'system';

/**
 * Log an activity in the system
 * 
 * @param action - The action performed
 * @param module - The module where the action was performed
 * @param details - Description of the activity
 * @param ipAddress - Optional IP address (will be auto-detected if not provided)
 * @returns Promise resolving to the response from the API
 */
export async function logActivity(
  action: ActivityAction,
  module: SystemModule,
  details: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        module,
        details,
        ipAddress,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log activity:', await response.json());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

/**
 * Helper function to log view activities
 */
export function logView(module: SystemModule, details: string): Promise<boolean> {
  return logActivity('view', module, details);
}

/**
 * Helper function to log create activities
 */
export function logCreate(module: SystemModule, details: string): Promise<boolean> {
  return logActivity('create', module, details);
}

/**
 * Helper function to log update activities
 */
export function logUpdate(module: SystemModule, details: string): Promise<boolean> {
  return logActivity('update', module, details);
}

/**
 * Helper function to log delete activities
 */
export function logDelete(module: SystemModule, details: string): Promise<boolean> {
  return logActivity('delete', module, details);
}
