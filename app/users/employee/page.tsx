'use client';

import { FiCalendar, FiCreditCard, FiClock, FiBell } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Notifications from '../../../components/Notifications';
import ActivityLogger from '@/components/ActivityLogger';
import { logActivity } from '@/lib/activityLogger';

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [birthdaysToday, setBirthdaysToday] = useState<string[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [userLeaveRequests, setUserLeaveRequests] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    attendance: '0%',
    leavesRemaining: 0,
    leavesTaken: 0,
    upcomingSalary: 0,
    recentPayments: []
  });
  
  console.log('Employee dashboard - Auth status:', status);
  console.log('Employee dashboard - Session:', session);
  
  // Log employee dashboard view
  useEffect(() => {
    if (session?.user) {
      console.log('Employee dashboard - Logging activity for user:', session.user);
      logActivity('view', 'dashboard', 'Employee accessed main dashboard');
    }
  }, [session]);
  
  // Handle authentication redirects
  useEffect(() => {
    if (status === 'loading') {
      console.log('Employee dashboard - Auth status loading...');
      return; // Wait until we know the authentication status
    }
    
    if (status === 'unauthenticated') {
      console.log('Employee dashboard - User not authenticated, redirecting to login');
      // Use window.location for most reliable redirect from protected pages
      window.location.href = '/';
    } else if (session?.user?.role && session.user.role !== 'employee') {
      console.log(`Employee dashboard - Incorrect role (${session.user.role}), redirecting...`);
      // Redirect to appropriate dashboard based on role
      const rolePath = session.user.role === 'hr' ? '/users/hr' : '/users/manager';
      router.replace(rolePath);
    }
  }, [status, session, router]);

  // Fetch employee data
  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch employee stats
      fetch('/api/employee/status')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.text();
        })
        .then(text => {
          // Check if response is empty
          if (!text || text.trim() === '') {
            return { success: false };
          }
          // Try to parse JSON
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("Error parsing JSON:", e);
            return { success: false };
          }
        })
        .then(data => {
          if (data.success) {
            setStats({
              attendance: data.attendance || '0%',
              leavesRemaining: data.leavesRemaining || 0,
              leavesTaken: data.leavesTaken || 0,
              upcomingSalary: data.salary || 0,
              recentPayments: data.recentPayments || []
            });
          }
        })
        .catch(err => console.error('Error fetching employee stats:', err));

      // Fetch birthdays
      fetch('/api/employee/birthdays')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.text();
        })
        .then(text => {
          // Check if response is empty
          if (!text || text.trim() === '') {
            return { success: false, birthdaysToday: [] };
          }
          // Try to parse JSON
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("Error parsing JSON:", e);
            return { success: false, birthdaysToday: [] };
          }
        })
        .then(data => {
          if (data.success) {
            setBirthdaysToday(data.birthdaysToday || []);
          }
        })
        .catch(err => console.error('Error fetching birthdays:', err));

      // Fetch employee's leave requests
      fetch('/api/leave?source=leaveRequest.db', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.text();
        })
        .then(text => {
          // Check if response is empty
          if (!text || text.trim() === '') {
            return [];
          }
          // Try to parse JSON
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("Error parsing JSON:", e);
            return [];
          }
        })
        .then(data => {
          // Handle different response formats
          let requests = [];
          if (Array.isArray(data)) {
            requests = data;
          } else if (data && data.data && Array.isArray(data.data)) {
            requests = data.data;
          } else if (data && data.requests && Array.isArray(data.requests)) {
            requests = data.requests;
          }
          
          // Filter for the employee's own requests (recent ones only)
          const today = new Date();
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(today.getMonth() - 3);

          // Get only relevant leave requests (recent and upcoming)
          const relevantRequests = requests.filter((req: any) => {
            if (!req.endDate) return false;
            const endDate = new Date(req.endDate);
            return endDate >= threeMonthsAgo;
          });

          // Show a maximum of 5 leave requests in notifications
          setUserLeaveRequests(relevantRequests.slice(0, 5));

          // Filter for pending approvals if the user has manager permissions
          const pending = requests.filter((req: any) => req.status === 'Pending');
          setPendingApprovals(pending);
        })
        .catch(err => console.error('Error fetching leave requests:', err));
        
      // Fetch recent announcements (within last 5 days)
      fetch('/api/announcements')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.text();
        })
        .then(text => {
          // Check if response is empty
          if (!text || text.trim() === '') {
            return [];
          }
          // Try to parse JSON
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("Error parsing JSON:", e);
            return [];
          }
        })
        .then(data => {
          // Filter announcements from the past 5 days
          const fiveDaysAgo = new Date();
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
          
          let announcements = Array.isArray(data) ? data : [];
          const recentOnes = announcements.filter((announcement: any) => {
            const announcementDate = new Date(announcement.date);
            return announcementDate >= fiveDaysAgo;
          });
          
          setRecentAnnouncements(recentOnes);
        })
        .catch(err => console.error('Error fetching announcements:', err));
    }
  }, [status]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Only render dashboard if authenticated
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Employee Dashboard</h1>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Attendance Card */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Attendance</h3>
                <p className="text-2xl font-bold mt-1 dark:text-white">{stats.attendance}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This month</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                <FiClock className="text-xl" />
              </div>
            </div>
          </div>
          
          {/* Leaves Card */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Leaves</h3>
                <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">{stats.leavesRemaining}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Remaining ({stats.leavesTaken} taken)
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                <FiCalendar className="text-xl" />
              </div>
            </div>
          </div>

          {/* Salary Card */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Upcoming Salary</h3>
                <p className="text-2xl font-bold mt-1 dark:text-white">PKR {stats.upcomingSalary}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Expected at month-end</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                <FiCreditCard className="text-xl" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Notifications Section - Using our component with employee specific data */}
        <Notifications 
          birthdaysToday={birthdaysToday} 
          userLeaveRequests={userLeaveRequests}
          recentAnnouncements={recentAnnouncements}
          isEmployee={true}
        />
      </div>
    </div>
  );
}