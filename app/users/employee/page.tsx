'use client';

import { FiCalendar, FiDollarSign, FiClock, FiBell } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Sample data - replace with actual API calls
  const stats = {
    attendance: '92%',
    leavesRemaining: 12,
    leavesTaken: 3,
    upcomingSalary: 4500,
    recentPayments: [
      { month: 'May 2023', amount: 4500 },
      { month: 'April 2023', amount: 4500 }
    ]
  };

  const notifications = [
    { id: 1, type: 'birthday', message: "John Doe's birthday tomorrow", date: '2023-06-15' },
    { id: 2, type: 'deadline', message: "Timesheet submission due in 2 days", date: '2023-06-17' },
    { id: 3, type: 'birthday', message: "James birthday", date: '2023-06-17' }
  ];
  
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
                <p className="text-2xl font-bold mt-1 dark:text-white">${stats.upcomingSalary}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Expected June 30</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                <FiDollarSign className="text-xl" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Notifications Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
              <FiBell className="text-blue-600 dark:text-blue-400" />
              Upcoming Notifications
            </h2>
          </div>
          <div className="p-6">
            {notifications.length > 0 ? (
              <ul className="space-y-4">
                {notifications.map(notification => (
                  <li key={notification.id} className="flex items-start p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className={`flex-shrink-0 mt-1 h-5 w-5 rounded-full flex items-center justify-center ${
                      notification.type === 'birthday' 
                        ? 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300' 
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300'
                    }`}>
                      <FiBell className="text-xs" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{notification.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}