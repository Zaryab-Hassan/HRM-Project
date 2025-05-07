'use client';
import { useState, useEffect } from 'react';
import { FiClock, FiTrendingUp } from 'react-icons/fi';
import TodaysAttendance from '../../../../components/TodaysAttendance';
import AttendanceRecords from '../../../../components/AttendanceRecords';

// Define employee type
type EmployeeWithAttendance = {
  _id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  status: "Active" | "On Leave" | "Terminated";
  clockedInToday: boolean;
  clockedOutToday: boolean;
  clockInTime: string | undefined;
  clockOutTime: string | undefined;
}

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState('tracking');
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
    // Function to determine if an employee is late (assume 9:00 AM is the cutoff)
  const isLateClockIn = (clockInTime: string) => {
    if (!clockInTime) return false;
    
    // For this demonstration, we'll use a simple string comparison
    // In a real app, you'd want to use proper date parsing
    const clockInHour = parseInt(clockInTime.split(':')[0]);
    return clockInHour >= 9;
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Format time from Date object to HH:MM AM/PM
  const formatTime = (dateTime: Date) => {
    if (!dateTime) return null;
    return new Date(dateTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Fetch employees from API
        const response = await fetch('/api/hr/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        
        const responseData = await response.json();
        // Extract the employees array from the response data
        const employeesData = responseData.data || [];
        
        // Process employee data to include today's attendance information
        const today = new Date();
        const todayStr = formatDate(today);
        
        const employeesWithAttendance: EmployeeWithAttendance[] = employeesData.map((employee: any) => {
          // Find today's attendance record for the employee
          const todayAttendance = employee.attendance?.find((record: any) => 
            formatDate(new Date(record.date)) === todayStr
          );
          
          return {
            _id: employee._id,
            name: employee.name,
            department: employee.department,
            role: employee.role,
            email: employee.email,
            status: employee.status,
            clockedInToday: !!todayAttendance?.clockIn,
            clockedOutToday: !!todayAttendance?.clockOut,
            clockInTime: todayAttendance?.clockIn ? formatTime(new Date(todayAttendance.clockIn)) : undefined,
            clockOutTime: todayAttendance?.clockOut ? formatTime(new Date(todayAttendance.clockOut)) : undefined
          };
        });
        
        setEmployees(employeesWithAttendance);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Attendance Management</h1>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2 ${activeTab === 'tracking' ? 
            'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
            'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'}`}
        >
          <FiClock className="inline mr-2" /> In-Out Tracking
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 ${activeTab === 'records' ? 
            'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
            'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'}`}
        >
          <FiTrendingUp className="inline mr-2" /> Attendance Records
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tracking' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FiClock className="mr-2" /> Today's Clock In/Out Time
            </h2>
            <p className="text-white text-opacity-90 mt-1">
              Monitor employee clock in/out status
            </p>
          </div>
          
          <div className="p-4">
            {/* TodaysAttendance Component */}
            <TodaysAttendance employees={employees} loading={loading} />
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FiTrendingUp className="mr-2" /> Attendance History & Reports
            </h2>
            <p className="text-white text-opacity-90 mt-1">
              View and export historical attendance data
            </p>
          </div>
          
          <div className="p-4">
            <AttendanceRecords loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}