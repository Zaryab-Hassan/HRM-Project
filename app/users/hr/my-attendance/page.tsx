'use client';

import { useState, useEffect } from 'react';
import { FiLogIn, FiLogOut, FiClock, FiCalendar } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // State for HR's own attendance
  const [attendanceStatus, setAttendanceStatus] = useState<'clocked-in' | 'clocked-out'>('clocked-out');
  const [lastActionTime, setLastActionTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

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
          if (response.status === 401) {
            router.push('/?error=Session expired. Please login again.');
            return;
          }
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
  }, [status, session, router]);

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
        if (response.status === 401) {
          router.push('/?error=Session expired. Please login again.');
          return;
        }
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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Attendance</h1>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Clock In/Out Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
            <FiClock className="mr-2 text-blue-500" /> Clock In/Out
          </h2>
          
          <div className="flex flex-col items-center">
            <button
              onClick={handleClockAction}
              disabled={loading}
              className={`px-8 py-4 rounded-full text-white text-lg font-bold mb-4 flex items-center gap-2 ${
                loading ? 'bg-gray-400 cursor-not-allowed' :
                attendanceStatus === 'clocked-out' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading ? (
                'Processing...'
              ) : attendanceStatus === 'clocked-out' ? (
                <>
                  <FiLogIn /> Clock In
                </>
              ) : (
                <>
                  <FiLogOut /> Clock Out
                </>
              )}
            </button>
            
            {lastActionTime && (
              <p className="text-gray-600 dark:text-gray-300">
                {lastActionTime}
              </p>
            )}
          </div>
        </div>

        {/* Attendance Records */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
            <FiCalendar className="mr-2 text-blue-500" /> Attendance History
          </h2>
          
          {/* Using the MyAttendanceRecords Component */}
          <MyAttendanceRecords loading={loading} />
        </div>
      </div>
    </div>
  );
}