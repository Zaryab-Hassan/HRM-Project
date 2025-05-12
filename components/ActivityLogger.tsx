'use client';

import { useEffect } from 'react';
import { ActivityAction, SystemModule, logActivity } from '@/lib/activityLogger';

/**
 * A reusable component to automatically log user activities
 * This component can be placed in any page to log when a user accesses it
 */
interface ActivityLoggerProps {
  action?: ActivityAction;
  module: SystemModule;
  details: string;
  onlyLogOnce?: boolean;
}

export default function ActivityLogger({
  action = 'view',
  module,
  details,
  onlyLogOnce = true
}: ActivityLoggerProps) {
  useEffect(() => {
    // Create a unique key for this specific logging action
    const logKey = `activity_log_${module}_${action}_${details.substring(0, 20)}`;
    
    const shouldLog = !onlyLogOnce || !localStorage.getItem(logKey);
    
    if (shouldLog) {
      // Log the activity
      logActivity(action, module, details)
        .then(success => {
          if (success && onlyLogOnce) {
            // Set a flag in localStorage to prevent duplicate logs
            // This will expire after 24 hours
            localStorage.setItem(logKey, Date.now().toString());
            setTimeout(() => localStorage.removeItem(logKey), 24 * 60 * 60 * 1000);
          }
        })
        .catch(error => {
          console.error('Failed to log activity:', error);
        });
    }
  }, [action, module, details, onlyLogOnce]);

  // This component doesn't render anything
  return null;
}
