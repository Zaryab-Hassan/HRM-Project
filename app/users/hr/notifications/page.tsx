'use client';

import { useState, useEffect } from 'react';
import { FiBell, FiCalendar } from 'react-icons/fi';
import Notifications from '@/components/Notifications';
import PendingLeaveRequests from '@/components/PendingLeaveRequests';

// Define interfaces for the data structures
interface LeaveRequest {
  _id: string;
  employeeId: string | {
    _id: string;
    name: string;
    email: string;
  };
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  leaveType?: string;
  createdAt: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  urgency: 'low' | 'medium' | 'high';
  category: string;
}

export default function HRNotifications() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [birthdaysToday, setBirthdaysToday] = useState<string[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave requests, announcements, and birthdays
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leave requests
        const leaveResponse = await fetch('/api/leave');
        if (!leaveResponse.ok) {
          throw new Error('Failed to fetch leave requests');
        }
        const leaveData = await leaveResponse.json();
        
        // Handle different response formats to ensure we have an array of leave requests
        let requests: LeaveRequest[] = [];
        if (Array.isArray(leaveData)) {
          requests = leaveData;
        } else if (leaveData && leaveData.data && Array.isArray(leaveData.data)) {
          requests = leaveData.data;
        } else if (leaveData && leaveData.requests && Array.isArray(leaveData.requests)) {
          requests = leaveData.requests;
        } else {
          console.warn('Unexpected leave API response format:', leaveData);
          requests = [];
        }
        setLeaveRequests(requests);
        
        // Fetch announcements
        const announcementsResponse = await fetch('/api/announcements');
        if (!announcementsResponse.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const announcementsData = await announcementsResponse.json();
        const announcements: Announcement[] = Array.isArray(announcementsData) ? announcementsData : [];
        setRecentAnnouncements(announcements);
        
        // Fetch birthdays (using the employee endpoint which contains birthday info)
        const employeesResponse = await fetch('/api/employee/birthdays');
        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employee birthdays');
        }
        const birthdaysData = await employeesResponse.json();
        const birthdays: string[] = Array.isArray(birthdaysData) ? birthdaysData : [];
        setBirthdaysToday(birthdays);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveLeave = async (requestId: string) => {
    try {
      const response = await fetch(`/api/leave/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Approved' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve leave request');
      }

      // Update the local state to reflect the change
      setLeaveRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === requestId ? { ...request, status: 'Approved' } : request
        )
      );
    } catch (err) {
      console.error('Error approving leave request:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve leave request');
    }
  };

  const handleRejectLeave = async (requestId: string) => {
    try {
      const response = await fetch(`/api/leave/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Rejected' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject leave request');
      }

      // Update the local state to reflect the change
      setLeaveRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === requestId ? { ...request, status: 'Rejected' } : request
        )
      );
    } catch (err) {
      console.error('Error rejecting leave request:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject leave request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Filter the pending leave requests
  const pendingLeaveRequests = leaveRequests.filter(req => 
    req && req.status && req.status.toLowerCase() === 'pending'
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Notifications</h1>

        {/* Leave Requests Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center dark:text-white">
              <FiCalendar className="mr-2 text-pink-600" />
              Pending Leave Requests
            </h2>
          </div>
          <PendingLeaveRequests 
            leaveRequests={leaveRequests} 
            onApproveAction={handleApproveLeave} 
            onRejectAction={handleRejectLeave} 
          />
        </div>

        {/* Notifications Section */}
        <Notifications 
          birthdaysToday={birthdaysToday} 
          pendingApprovals={pendingLeaveRequests}
          recentAnnouncements={recentAnnouncements}
          isEmployee={false}
        />
      </div>
    </div>
  );
}