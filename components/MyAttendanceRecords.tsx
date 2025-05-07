'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiFilter, FiDownload, FiSearch } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type AttendanceRecord = {
  _id: string;
  date: string | Date;
  clockIn?: string | Date;
  clockOut?: string | Date;
  status: 'present' | 'absent' | 'leave';
  hoursWorked?: number;
  autoClockOut: boolean;
  notes?: string;
};

interface MyAttendanceRecordsProps {
  loading: boolean;
}

// Define session user type with expected properties
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function MyAttendanceRecords({ loading }: MyAttendanceRecordsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadingRecords, setLoadingRecords] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch attendance records for the logged-in employee
  useEffect(() => {
    const fetchMyAttendanceRecords = async () => {
      if (status !== 'authenticated') return;
      
      setLoadingRecords(true);
      setError(null);
      
      try {
        // Type assertion to help TypeScript recognize the user properties
        const user = session?.user as ExtendedUser;
        const employeeId = user?.id;
        
        if (!employeeId) {
          throw new Error('Employee ID not found in session');
        }
        
        // Make sure dates are in YYYY-MM-DD format without time component
        const formattedStartDate = startDate;
        const formattedEndDate = endDate;
        
        // Add content type header and ensure proper URL encoding
        // Include employeeId in the query parameters
        const response = await fetch(
          `/api/employee/attendance?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}&employeeId=${employeeId}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/?error=Session expired. Please login again.');
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch attendance records');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch attendance records');
        }
        
        // Process the attendance records
        const formattedRecords = (data.data || []).map((record: any) => {
          let hoursWorked = 0;
          if (record.clockIn && record.clockOut) {
            const clockIn = new Date(record.clockIn);
            const clockOut = new Date(record.clockOut);
            hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          }
          
          return {
            ...record,
            date: record.date ? new Date(record.date) : new Date(),
            clockIn: record.clockIn ? new Date(record.clockIn) : undefined,
            clockOut: record.clockOut ? new Date(record.clockOut) : undefined,
            hoursWorked: hoursWorked.toFixed(2),
          };
        })
        // Sort records by date (most recent first)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setAttendanceRecords(formattedRecords);
        setFilteredRecords(formattedRecords);
        
      } catch (err) {
        console.error('Error fetching attendance records:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance records');
        
        if (err instanceof Error && 
            (err.message.includes('Authentication') || err.message.includes('token'))) {
          router.push('/?error=Authentication failed. Please login again.');
        }
      } finally {
        setLoadingRecords(false);
      }
    };

    if (!loading && status === 'authenticated') {
      fetchMyAttendanceRecords();
    }
  }, [startDate, endDate, loading, status, router, session]);

  // Apply status filter
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRecords(attendanceRecords);
      return;
    }
    
    const filtered = attendanceRecords.filter(record => {
      if (statusFilter === 'present') {
        return record.status === 'present';
      } else if (statusFilter === 'absent') {
        return record.status === 'absent';
      } else if (statusFilter === 'leave') {
        return record.status === 'leave';
      } else if (statusFilter === 'late') {
        if (record.clockIn) {
          const clockInTime = new Date(record.clockIn);
          // Assuming 9:00 AM is the start time
          const startTime = new Date(clockInTime);
          startTime.setHours(9, 0, 0, 0);
          return clockInTime > startTime;
        }
        return false;
      }
      return true;
    });
    
    setFilteredRecords(filtered);
  }, [statusFilter, attendanceRecords]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Export attendance data to CSV
  const exportToCSV = () => {
    // Create CSV content
    let csvContent = "Date,Clock In,Clock Out,Hours Worked,Status\n";
    
    filteredRecords.forEach(record => {
      csvContent += [
        record.date ? formatDate(new Date(record.date)) : '',
        record.clockIn ? formatTime(new Date(record.clockIn)) : 'Not Clocked In',
        record.clockOut ? formatTime(new Date(record.clockOut)) : 'Not Clocked Out',
        record.hoursWorked || '0',
        record.status
      ].join(',') + "\n";
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `my_attendance_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiCalendar className="dark:text-gray-300" /> My Attendance Records
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date filters */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 text-sm"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>
      
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>
        
        {/* Export button */}
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
        >
          <FiDownload /> Export to CSV
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Attendance records table */}
      <div className="overflow-x-auto">
        {loading || loadingRecords ? (
          <div className="p-6 animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            ))}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hours Worked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                      {record.date ? formatDate(new Date(record.date)) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.clockIn ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          {formatTime(new Date(record.clockIn))}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Not Clocked In
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.clockOut ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {formatTime(new Date(record.clockOut))}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Not Clocked Out
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                      {record.hoursWorked || '0'} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === 'present' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Present
                        </span>
                      )}
                      {record.status === 'absent' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                          Absent
                        </span>
                      )}
                      {record.status === 'leave' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          On Leave
                        </span>
                      )}
                      {record.autoClockOut && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Auto
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No attendance records found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}