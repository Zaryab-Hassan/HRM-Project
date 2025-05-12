'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logActivity, ActivityAction, SystemModule } from './activityLogger';

/**
 * Hook to automatically log user activity based on page navigation
 */
export function useActivityLogger() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  useEffect(() => {
    // Only log if user is authenticated
    if (session?.user) {
      // Extract module and details from pathname
      const pathSegments = pathname.split('/').filter(Boolean);
        // Determine module based on pathname
      let module: SystemModule = 'system';
      if (pathname.includes('/profile')) module = 'profile';
      else if (pathname.includes('/attendance')) module = 'attendance';
      else if (pathname.includes('/payroll')) module = 'payroll';
      else if (pathname.includes('/leave')) module = 'leave';
      else if (pathname.includes('/loan')) module = 'loan';
      else if (pathname.includes('/logs')) module = 'system';
      else if (pathname.includes('/usermanagement')) module = 'employee';
      else if (pathname.includes('/employees')) module = 'employee';
      
      // Generate more specific details based on the last path segment
      const pageName = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : 'dashboard';
      const userType = session.user.role;
        // Log the page view
      const action: ActivityAction = 'view';
      logActivity(
        action,
        module, 
        `${userType} accessed ${pageName} page`
      ).catch(error => {
        console.error('Failed to log activity:', error);
      });
    }
  }, [pathname, session]);
  
  return null;
}

/**
 * Component to automatically log user activities across the application
 */
export default function AutoActivityLogger() {
  useActivityLogger();
  
  // This component doesn't render anything
  return null;
}
