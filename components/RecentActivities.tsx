'use client';

import { useState, useEffect } from 'react';
import { Card, Text, Title, Badge, Divider } from '@/components/ui/ActivityLogsComponents';

interface RecentActivityLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<RecentActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API with a limit of 10 recent activities
        try {
          const response = await fetch('/api/activity-logs?limit=10');
          
          if (response.ok) {
            const data = await response.json();
            setActivities(data.logs);
          } else {
            // If API fails, use mock data
            const mockData = generateMockActivities(10);
            setActivities(mockData);
          }
        } catch (apiError) {
          // If API is not available, use mock data
          const mockData = generateMockActivities(10);
          setActivities(mockData);
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setError('Failed to load recent activities');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  // Format timestamp to readable format
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(date));
  };

  // Get badge color based on action type
  const getBadgeColor = (action: string): string => {
    switch (action.toLowerCase()) {
      case 'login': return 'blue';
      case 'logout': return 'gray';
      case 'create': return 'green';
      case 'update': return 'yellow';
      case 'delete': return 'red';
      case 'view': return 'indigo';
      case 'download': return 'purple';
      default: return 'gray';
    }
  };

  // Generate mock activities for preview
  function generateMockActivities(count: number): RecentActivityLog[] {
    const actions = ['login', 'logout', 'create', 'update', 'delete', 'view'];
    const modules = ['profile', 'attendance', 'payroll', 'leave', 'employee', 'settings'];
    const users = [
      { name: 'John Doe', role: 'employee' },
      { name: 'Jane Smith', role: 'employee' },
      { name: 'Robert Johnson', role: 'manager' },
      { name: 'Lisa Wong', role: 'hr' }
    ];
    
    const logs: RecentActivityLog[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const module = modules[Math.floor(Math.random() * modules.length)];
      
      // Generate random date within the last 24 hours
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 24));
      
      logs.push({
        id: `log-${i}`,
        userName: user.name,
        userRole: user.role,
        action,
        module,
        details: `${user.name} ${action}ed ${module}`,
        timestamp: date
      });
    }
    
    // Sort by timestamp (newest first)
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  return (
    <Card className="h-full">
      <div className="flex justify-between items-center mb-4">
        <Title>Recent Activities</Title>
        <a href="/users/manager/logs" className="text-pink-600 text-sm hover:text-pink-700 flex items-center">
          View All
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
      
      <Divider />
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-gray-500">{error}</div>
      ) : (
        <div className="space-y-4 mt-2">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center">
                  <Badge color={getBadgeColor(activity.action)} size="sm">
                    {activity.action.toUpperCase()}
                  </Badge>
                  <Text className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                    {activity.userName}
                  </Text>
                </div>
                <Text className="text-sm mt-1">{activity.details}</Text>
                <Text className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</Text>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-6">
              <Text>No recent activities found</Text>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
