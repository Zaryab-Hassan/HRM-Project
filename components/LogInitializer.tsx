'use client';

import { useEffect } from 'react';
import { logActivity } from '@/lib/activityLogger';

/**
 * This component creates an initial activity log entry for demonstration purposes
 * It only runs once when the logs page is loaded
 */
export default function LogInitializer() {
  useEffect(() => {
    const createInitialLog = async () => {      try {
        // Check if we already have logs by making a GET request
        console.log('LogInitializer: Checking for existing logs...');
        const response = await fetch('/api/activity-logs?limit=1');

        // Check for authentication errors
        if (response.status === 401) {
          console.error('LogInitializer: Authentication required - User not logged in');
          return;
        }
        
        if (response.status === 403) {
          console.error('LogInitializer: Access denied - User does not have permission');
          return;
        }
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // If we don't have any logs, create an initial one
        if (!data.logs || data.logs.length === 0) {
          console.log('LogInitializer: No logs found, creating an initial activity log entry');
          
          // Create an initial log entry directly with the API
          const createResponse = await fetch('/api/activity-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'view',
              module: 'logs',
              details: 'Initial system access - viewing activity logs'
            }),
          });
          
          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(`Failed to create log: ${errorData.error || createResponse.statusText}`);
          }
          
          console.log('LogInitializer: Initial log created successfully');
        } else {
          console.log('LogInitializer: Existing logs found, no need to create initial log');
        }
      } catch (error) {
        console.error('LogInitializer error:', error);
      }
    };
    
    createInitialLog();
  }, []);
  
  // This component doesn't render anything
  return null;
}
