import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Helper function to extract action and module from URL path
 */
function extractActivityInfo(path: string): { action: string; module: string } | null {
  // Skip API routes that shouldn't be logged
  if (path.includes('activity-logs')) {
    return null;
  }
  
  // Default values
  let action = 'view';
  let module = 'system';
  
  // Extract module from path
  if (path.includes('/employee')) module = 'employee';
  else if (path.includes('/attendance')) module = 'attendance';
  else if (path.includes('/payroll')) module = 'payroll';
  else if (path.includes('/leave')) module = 'leave';
  else if (path.includes('/loan')) module = 'loan';
  else if (path.includes('/profile')) module = 'profile';
  else if (path.includes('/settings')) module = 'settings';
  else if (path.includes('/users/hr')) module = 'hr';
  else if (path.includes('/users/manager')) module = 'manager';
  
  // Extract action from HTTP method and path
  if (path.includes('create') || path.endsWith('/new')) action = 'create';
  else if (path.includes('edit') || path.includes('update')) action = 'update';
  else if (path.includes('delete')) action = 'delete';
  else if (path.includes('download')) action = 'download';
  
  return { action, module };
}

/**
 * Middleware to log API activity
 */
export async function activityLoggerMiddleware(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  
  // Only log API requests
  if (!path.startsWith('/api/')) {
    return handler();
  }
  
  // Skip logging activity-logs API requests (to avoid infinite loops)
  if (path.includes('/api/activity-logs')) {
    return handler();
  }
  
  // Extract activity info from the path
  const activityInfo = extractActivityInfo(path);
  if (!activityInfo) {
    return handler();
  }
  
  // Process the request normally
  const response = await handler();
  
  // Only log successful requests
  if (response.status >= 200 && response.status < 300) {
    try {
      // Determine HTTP method
      let methodAction = req.method === 'GET' ? 'view' : 
                         req.method === 'POST' ? 'create' :
                         req.method === 'PUT' || req.method === 'PATCH' ? 'update' :
                         req.method === 'DELETE' ? 'delete' : 'access';

      // Override with more specific action if available
      const action = activityInfo.action || methodAction;
      const module = activityInfo.module;
      
      // Format details based on the action and path
      const details = `${action.charAt(0).toUpperCase() + action.slice(1)} ${module}`;
      
      // Get client IP
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      
      // Log the activity
      fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          module,
          details,
          ipAddress: ip,
        }),
      }).catch(err => {
        console.error('Failed to log activity:', err);
      });
    } catch (error) {
      // Don't let logging failures affect the response
      console.error('Error in activity logger middleware:', error);
    }
  }
  
  return response;
}
