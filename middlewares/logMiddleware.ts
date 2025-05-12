import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Activity logging middleware - Logs various user activities
 * This middleware integrates with our activity-logs API
 * to automatically record user page views
 */
export async function logActivity(req: NextRequest, res: NextResponse) {
  if (req.nextUrl.pathname.startsWith('/api')) {
    // Skip API routes to avoid circular calls
    return;
  }

  // Skip static assets
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/static') ||
    req.nextUrl.pathname.endsWith('.ico') ||
    req.nextUrl.pathname.endsWith('.png') ||
    req.nextUrl.pathname.endsWith('.jpg') ||
    req.nextUrl.pathname.endsWith('.svg')
  ) {
    return;
  }

  try {
    // Determine module from path
    let module = 'system';
    const path = req.nextUrl.pathname;
    
    if (path.includes('/profile')) module = 'profile';
    else if (path.includes('/attendance')) module = 'attendance';
    else if (path.includes('/payroll')) module = 'payroll';
    else if (path.includes('/leave')) module = 'leave';
    else if (path.includes('/loan')) module = 'loan';
    else if (path.includes('/logs')) module = 'logs';
    else if (path.includes('/usermanagement')) module = 'employee';
    else if (path.includes('/employee')) module = 'employee';

    // Generate details based on path
    const pathSegments = path.split('/').filter(Boolean);
    const pageName = pathSegments[pathSegments.length - 1] || 'dashboard';
    const details = `Accessed ${pageName} page`;

    // Post to the activity logs API
    const origin = req.nextUrl.origin;
    const response = await fetch(`${origin}/api/activity-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        action: 'view',
        module,
        details,
      }),
    });

    // Don't block on the logging result
    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
    }
  } catch (error) {
    console.error('Error in activity logger middleware:', error);
  }
}
