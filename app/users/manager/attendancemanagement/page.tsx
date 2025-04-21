// app/attendance-manager/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiCheckCircle, FiXCircle, FiBarChart2, FiDownload, FiUser, FiClock } from 'react-icons/fi';

// Import components
import PendingLeaveRequests from '@/components/PendingLeaveRequests';
import TodaysAttendance from '@/components/TodaysAttendance';
import EmployeeStatus from '@/components/EmployeeStatus';

// Define LeaveRequest interface locally instead of importing it
type LeaveRequest = {
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
  type?: string;
  leaveType?: string;
  createdAt: string;
};

type AttendanceData = {
  date: string;
  present: number;
  absent: number;
  onLeave: number;
};

type AttendanceRecord = {
  _id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'leave';
  hoursWorked?: number;
  autoClockOut: boolean;
  notes?: string;
};

type Employee = {
  _id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  attendance?: AttendanceRecord[];
  clockedInToday?: boolean;
};

type AttendanceSummary = {
  present: number;
  absent: number;
  onLeave: number;
  averageAttendance: number;
  totalLeaves: number;
  absenteeismRate: number;
};

export default function AttendanceManager() {
  // Data states
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clockedInEmployees, setClockedInEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    present: 0,
    absent: 0,
    onLeave: 0,
    averageAttendance: 0,
    totalLeaves: 0,
    absenteeismRate: 0
  });

  // UI states
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminatingEmployee, setTerminatingEmployee] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({
    employees: true,
    leaveRequests: true,
    attendance: true,
    clockedIn: true
  });

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(prev => ({ ...prev, leaveRequests: true }));
        // Fetch directly from the leaveRequest.db database
        const response = await fetch('/api/leave?source=leaveRequest.db');

        if (!response.ok) {
          throw new Error('Failed to fetch leave requests');
        }

        const data = await response.json();
        
        // Handle the response data format properly
        let leaveRequestsData = [];
        if (data && data.success && Array.isArray(data.data)) {
          // New response format
          leaveRequestsData = data.data;
        } else if (data && Array.isArray(data)) {
          // If API returns an array directly
          leaveRequestsData = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          // Old response format
          leaveRequestsData = data.data;
        }
        
        // Make sure we handle any potential issues with data structure
        const formattedLeaveRequests: LeaveRequest[] = leaveRequestsData.map((req: any): LeaveRequest => ({
          ...req,
          // Ensure we have a status field and it's a string
          status: req.status || 'Pending'
        }));
        
        setLeaveRequests(formattedLeaveRequests);
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch leave requests');
      } finally {
        setLoading(prev => ({ ...prev, leaveRequests: false }));
      }
    };

    fetchLeaveRequests();
  }, []);

  // Fetch employees with today's attendance status
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(prev => ({ ...prev, employees: true, clockedIn: true }));

        // Fetch all employees
        const employeesResponse = await fetch('/api/employee/profile/all');
        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employees');
        }
        const employeesData = await employeesResponse.json();

        // Fetch today's attendance data
        const today = new Date();
        const todayISODate = today.toISOString().split('T')[0];
        const attendanceResponse = await fetch('/api/employee/attendance?date=' + todayISODate);

        if (!attendanceResponse.ok) {
          throw new Error('Failed to fetch attendance data');
        }

        const attendanceData = await attendanceResponse.json();
        const clockedInEmployeeIds = new Set(
          (attendanceData.data || [])
            .filter((record: any) => record.clockIn && !record.clockOut)
            .map((record: any) => record.employeeId)
        );

        // Mark employees who are clocked in
        const employeesWithAttendance = (employeesData.data || []).map((employee: Employee) => ({
          ...employee,
          clockedInToday: clockedInEmployeeIds.has(employee._id)
        }));

        setEmployees(employeesWithAttendance);
        setClockedInEmployees(employeesWithAttendance.filter((emp: Employee) => emp.clockedInToday));

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      } finally {
        setLoading(prev => ({ ...prev, employees: false, clockedIn: false }));
      }
    };

    fetchEmployees();
  }, []);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(prev => ({ ...prev, attendance: true }));

        // Get attendance summary
        const summaryResponse = await fetch('/api/manager/summary');
        if (!summaryResponse.ok) {
          throw new Error('Failed to fetch attendance summary');
        }
        const summaryData = await summaryResponse.json();

        // Filter out terminated employees from attendance count
        // We're using employees state which was populated in the previous useEffect
        const activeEmployees = employees.filter(emp => emp.status !== 'Terminated');
        const activeEmployeeCount = activeEmployees.length;
        
        // Calculate the present, absent, and on leave values for active employees only
        const presentCount = activeEmployees.filter(emp => emp.clockedInToday).length;
        // Use the ratio from API but apply to active employees only
        const absentRatio = summaryData.todayAbsent / (summaryData.todayPresent + summaryData.todayAbsent + summaryData.todayOnLeave || 1);
        const leaveRatio = summaryData.todayOnLeave / (summaryData.todayPresent + summaryData.todayAbsent + summaryData.todayOnLeave || 1);
        
        const absentCount = Math.round(absentRatio * activeEmployeeCount);
        const onLeaveCount = Math.round(leaveRatio * activeEmployeeCount);

        // Set the attendance summary
        setAttendanceSummary({
          present: presentCount,
          absent: absentCount,
          onLeave: onLeaveCount,
          averageAttendance: summaryData.averageAttendance || 0,
          totalLeaves: summaryData.totalLeaves || 0,
          absenteeismRate: summaryData.absenteeismRate || 0
        });

        // Get attendance trend data for the last 5 days
        const today = new Date();
        const trendData = [];

        // Either fetch trends or calculate from available data
        for (let i = 4; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          // You could fetch this data from an API endpoint that provides historical data
          // For now, use the summary data with slight variations for demonstration
          trendData.push({
            date: formattedDate,
            present: presentCount ? Math.max(0, presentCount - Math.floor(Math.random() * 5)) : 85,
            absent: absentCount ? Math.max(0, absentCount + Math.floor(Math.random() * 3) - 1) : 10,
            onLeave: onLeaveCount || 5
          });
        }

        setAttendanceData(trendData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance data');
      } finally {
        setLoading(prev => ({ ...prev, attendance: false }));
      }
    };

    fetchAttendanceData();
  }, [employees]); // Added employees as dependency so this runs after employees are loaded

  // Define all handler functions
  const handleApproveLeave = async (id: string) => {
    try {
      const response = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Approved' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve leave request');
      }

      // Update local state to reflect the change
      setLeaveRequests(requests =>
        requests.map(request =>
          request._id === id ? { ...request, status: 'Approved' } : request
        )
      );

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve leave request');
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      const response = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Rejected' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject leave request');
      }

      // Update local state to reflect the change
      setLeaveRequests(requests =>
        requests.map(request =>
          request._id === id ? { ...request, status: 'Rejected' } : request
        )
      );

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject leave request');
    }
  };

  const handleTerminateEmployee = async (employeeId: string) => {
    try {
      setTerminatingEmployee(employeeId);
      const response = await fetch('/api/employee/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, status: 'Terminated' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to terminate employee');
      }

      // Update the local state to reflect the termination
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp._id === employeeId ? { ...emp, status: 'Terminated' } : emp
        )
      );

      setError('');
      alert('Employee has been terminated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate employee');
    } finally {
      setTerminatingEmployee(null);
    }
  };

  // Render component
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Attendance Manager</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Daily Attendance Summary */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <FiCalendar className="dark:text-gray-300" /> Today's Attendance Summary
            </h2>
            {loading.attendance ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-2 dark:text-gray-300">
                <p>Present: <span className="font-bold dark:text-white">{attendanceSummary.present}</span></p>
                <p>Absent: <span className="font-bold dark:text-white">{attendanceSummary.absent}</span></p>
                <p>On Leave: <span className="font-bold dark:text-white">{attendanceSummary.onLeave}</span></p>
                <p className="pt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  {clockedInEmployees.length} employees currently clocked in
                </p>
              </div>
            )}
          </div>

          {/* Monthly Overview */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <FiBarChart2 className="dark:text-gray-300" /> Monthly Overview
            </h2>
            {loading.attendance ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-2 dark:text-gray-300">
                <p>Average Attendance: <span className="font-bold dark:text-white">{attendanceSummary.averageAttendance}%</span></p>
                <p>Total Leaves: <span className="font-bold dark:text-white">{attendanceSummary.totalLeaves}</span></p>
                <p>Absenteeism Rate: <span className="font-bold dark:text-white">{attendanceSummary.absenteeismRate}%</span></p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow dark:shadow-gray-700">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button
                className="w-full py-2 px-4 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-gray-600"
                disabled={loading.attendance || loading.employees}
              >
                Generate Daily Report
              </button>
              <button
                className="w-full py-2 px-4 bg-green-100 dark:bg-gray-700 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-gray-600"
                disabled={loading.attendance || loading.employees}
              >
                Export Monthly Data
              </button>
            </div>
          </div>
        </div>

        {/* Today's Attendance Section - Using the new component */}
        <TodaysAttendance 
          employees={employees}
          loading={loading.clockedIn}
        />

        {/* Employee List Section */}
        <EmployeeStatus
          employees={employees}
          loading={loading.employees}
          onTerminateEmployee={handleTerminateEmployee}
        />

        {/* Leave Approval Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8 max-h-96 overflow-y-auto">
          <PendingLeaveRequests
            leaveRequests={leaveRequests}
            onApproveAction={handleApproveLeave}
            onRejectAction={handleRejectLeave}
          />
        </div>

        {/* Attendance Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
              <FiBarChart2 className="dark:text-gray-300" /> Attendance Trends
            </h2>
          </div>
          <div className="p-6">
            {loading.attendance ? (
              <div className="animate-pulse space-y-4">
                <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ) : (
              <>
                {/* Simple visualization using divs as bars */}
                <div className="flex flex-col space-y-6">
                  <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                    <span>Date</span>
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>

                  {attendanceData.map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="w-20 text-sm font-medium dark:text-white">{day.date}</span>
                        <div className="flex-1 ml-4">
                          {/* Present bar */}
                          <div className="relative h-8 mb-2">
                            <div
                              className="absolute h-full bg-green-500 dark:bg-green-600 rounded"
                              style={{ width: `${(day.present / (day.present + day.absent + day.onLeave)) * 100}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center pl-2 text-sm text-white">
                              Present: {day.present}
                            </div>
                          </div>

                          {/* Absent bar */}
                          <div className="relative h-8 mb-2">
                            <div
                              className="absolute h-full bg-red-500 dark:bg-red-600 rounded"
                              style={{ width: `${(day.absent / (day.present + day.absent + day.onLeave)) * 100}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center pl-2 text-sm text-white">
                              Absent: {day.absent}
                            </div>
                          </div>

                          {/* On Leave bar */}
                          <div className="relative h-8">
                            <div
                              className="absolute h-full bg-yellow-500 dark:bg-yellow-600 rounded"
                              style={{ width: `${(day.onLeave / (day.present + day.absent + day.onLeave)) * 100}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center pl-2 text-sm text-white">
                              On Leave: {day.onLeave}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <div className="flex justify-between">
                    <button className="px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 flex items-center gap-2">
                      <FiDownload /> Export Chart
                    </button>

                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-full"></div>
                        <span className="dark:text-gray-300">Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 dark:bg-red-600 rounded-full"></div>
                        <span className="dark:text-gray-300">Absent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 dark:bg-yellow-600 rounded-full"></div>
                        <span className="dark:text-gray-300">On Leave</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
          <p>Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}