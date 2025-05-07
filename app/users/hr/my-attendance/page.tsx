'use client';

import { useState, useEffect } from 'react';
import { FiLogIn, FiLogOut, FiClock, FiCalendar } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import MyAttendanceRecords from '@/components/MyAttendanceRecords';

// Define session user type with expected properties
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function MyAttendancePage() {
  const { data: session, status } = useSession();
  
  // State for HR's own attendance
  const [attendanceStatus, setAttendanceStatus] = useState<'clocked-in' | 'clocked-out'>('clocked-out');
  const [lastActionTime, setLastActionTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch HR's attendance status
  useEffect(() => {
    const fetchAttendanceStatus = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get today's date in YYYY-MM-DD format for the API
        const today = new Date().toISOString().split('T')[0];
        
        // Type assertion to help TypeScript recognize the user properties
        const user = session?.user as ExtendedUser;
        const employeeId = user?.id;
        
        if (!employeeId) {
          throw new Error('Employee ID not found in session');
        }
        
        // Make request with date parameter to get today's record specifically
        // Include employeeId in the query params just like in employee attendance
        const response = await fetch(`/api/employee/attendance?date=${today}&employeeId=${employeeId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch attendance status');
        }
        
        const data = await response.json();
        
        // Look for today's attendance record
        const todayRecord = data.data.find((record: any) => 
          new Date(record.date).toISOString().split('T')[0] === today
        );
        
        if (todayRecord) {
          if (todayRecord.clockIn && !todayRecord.clockOut) {
            setAttendanceStatus('clocked-in');
            setLastActionTime(`Clocked in at ${new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          } else if (todayRecord.clockIn && todayRecord.clockOut) {
            setAttendanceStatus('clocked-out');
            setLastActionTime(`Clocked out at ${new Date(todayRecord.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          } else {
            setAttendanceStatus('clocked-out');
            setLastActionTime(null);
          }
        }
      } catch (err) {
        console.error('Error fetching attendance status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance status');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchAttendanceStatus();
    }
  }, [status, session]);

  // Handle clock in/out
  const handleClockAction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Type assertion to help TypeScript recognize the user properties
      const user = session?.user as ExtendedUser;
      const employeeId = user?.id;
      
      if (!employeeId) {
        throw new Error('Employee ID not found in session');
      }
      
      const action = attendanceStatus === 'clocked-out' ? 'clock-in' : 'clock-out';
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action,
          employeeId // Include employee ID in the request body
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record attendance');
      }

      const data = await response.json();
      
      // Update the UI based on response
      const timeString = new Date(action === 'clock-in' ? data.data.clockIn : data.data.clockOut)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setAttendanceStatus(action === 'clock-in' ? 'clocked-in' : 'clocked-out');
      setLastActionTime(`${action === 'clock-in' ? 'Clocked in' : 'Clocked out'} at ${timeString}`);
      
    } catch (err) {
      console.error('Error recording attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Attendance</h1>
      
      {/* Clock In/Out Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <FiClock className="mr-2" /> Daily Attendance
          </h2>
          <p className="text-white text-opacity-90 mt-1">
            Track your daily clock in/out status
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-medium text-gray-700 dark:text-white mb-2">Today's Status</h3>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${
                  attendanceStatus === 'clocked-in' 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-red-500'
                }`}></div>
                <span className={`font-medium ${
                  attendanceStatus === 'clocked-in' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {attendanceStatus === 'clocked-in' ? 'Currently Clocked In' : 'Currently Clocked Out'}
                </span>
              </div>
              {lastActionTime && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {lastActionTime}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                <FiCalendar className="inline mr-1" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <button
                onClick={handleClockAction}
                disabled={loading}
                className={`px-8 py-3 rounded-lg text-white font-medium ${
                  attendanceStatus === 'clocked-in'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors duration-200 disabled:opacity-50 flex items-center`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-2"></div>
                ) : attendanceStatus === 'clocked-in' ? (
                  <>
                    <FiLogOut className="mr-2" /> Clock Out
                  </>
                ) : (
                  <>
                    <FiLogIn className="mr-2" /> Clock In
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {attendanceStatus === 'clocked-in' 
                  ? 'Click to end your work day' 
                  : 'Click to start your work day'}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Attendance Records */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <FiCalendar className="mr-2" /> Attendance History
          </h2>
        </div>
        <div className="p-4">
          <MyAttendanceRecords loading={status === 'loading'} />
        </div>
      </div>
    </div>
  );
}