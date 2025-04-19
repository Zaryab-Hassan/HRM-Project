// app/employees/attendance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiCalendar, FiLogIn, FiLogOut, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface AttendanceRecord {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  autoClockOut?: boolean;
}

export default function AttendancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // State for clock in/out
  const [attendanceStatus, setAttendanceStatus] = useState<'clocked-in' | 'clocked-out'>('clocked-out');
  const [lastActionTime, setLastActionTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Authentication check
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

  // Fetch attendance records on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAttendanceRecords();
    }
  }, [status]);

  // Fetch attendance records from the API
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);  // Reset error state
      const response = await fetch('/api/employee/attendance', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Clear local storage and redirect to login on auth error
          localStorage.clear();
          router.push('/?error=Session expired. Please login again.');
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch attendance records');
      }
      
      const data = await response.json();

      // Transform the data to match our component's format
      const formattedRecords = data.data.map((record: any) => ({
        date: new Date(record.date).toISOString().split('T')[0],
        clockIn: record.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        clockOut: record.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        status: record.status,
        autoClockOut: record.autoClockOut || false
      }));

      setAttendanceRecords(formattedRecords);
      checkTodayAttendance(formattedRecords);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance records';
      setError(errorMessage);
      if (errorMessage.includes('Authentication') || errorMessage.includes('token')) {
        localStorage.clear();
        router.push('/?error=Authentication failed. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check today's attendance status
  const checkTodayAttendance = (records: AttendanceRecord[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(record => record.date === today);
    
    if (todayRecord) {
      if (todayRecord.clockIn && !todayRecord.clockOut) {
        setAttendanceStatus('clocked-in');
        setLastActionTime(`Clocked in at ${todayRecord.clockIn}`);
      } else if (todayRecord.clockIn && todayRecord.clockOut) {
        setAttendanceStatus('clocked-out');
        setLastActionTime(`Clocked out at ${todayRecord.clockOut}`);
      }
    } else {
      setAttendanceStatus('clocked-out');
      setLastActionTime(null);
    }
  };

  // Handle clock in/out with better error handling
  const handleClockAction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const action = attendanceStatus === 'clocked-out' ? 'clock-in' : 'clock-out';
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          localStorage.clear();
          router.push('/?error=Session expired. Please login again.');
          return;
        }
        throw new Error(errorData.error || 'Failed to record attendance');
      }

      const data = await response.json();
      
      // Update the UI based on response
      const timeString = new Date(action === 'clock-in' ? data.data.clockIn : data.data.clockOut)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setAttendanceStatus(action === 'clock-in' ? 'clocked-in' : 'clocked-out');
      setLastActionTime(`${action === 'clock-in' ? 'Clocked in' : 'Clocked out'} at ${timeString}`);

      // Refresh attendance records
      await fetchAttendanceRecords();
    } catch (err) {
      console.error('Error recording attendance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to record attendance';
      setError(errorMessage);
      if (errorMessage.includes('Authentication') || errorMessage.includes('token')) {
        localStorage.clear();
        router.push('/?error=Authentication failed. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Filter records by selected month and year
  const filteredRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === selectedMonth && 
           recordDate.getFullYear() === selectedYear;
  });
  
  // Generate month options for filter
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate year options (current year and previous year)
  const years = [currentDate.getFullYear(), currentDate.getFullYear() - 1];

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Attendance</h1>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Clock In/Out Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
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
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
            <FiCalendar className="mr-2 text-blue-500" /> Attendance History
          </h2>
          
          {/* Month and Year Filter */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center">
              <label htmlFor="month-filter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Month:</label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-3 text-sm"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="year-filter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white py-1 px-3 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => {
                setSelectedMonth(currentDate.getMonth());
                setSelectedYear(currentDate.getFullYear());
              }}
              className="text-sm py-1 px-3 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              Current Month
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                        {record.clockIn || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                        <div className="flex items-center">
                          {record.clockOut || '-'}
                          {record.autoClockOut && (
                            <span title="System auto clock-out" className="ml-2 text-yellow-500">
                              <FiAlertTriangle />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          record.status === 'leave' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      {loading ? 'Loading attendance records...' : 'No attendance records found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}