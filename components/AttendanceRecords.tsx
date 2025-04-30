'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiFilter, FiDownload, FiSearch } from 'react-icons/fi';

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

type Employee = {
  _id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Terminated';
};

interface AttendanceRecordsProps {
  loading: boolean;
}

export default function AttendanceRecords({ loading }: AttendanceRecordsProps) {
  const [attendanceData, setAttendanceData] = useState<{ employee: Employee; records: AttendanceRecord[] }[]>([]);
  const [filteredData, setFilteredData] = useState<{ employee: Employee; records: AttendanceRecord[] }[]>([]);
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingRecords, setLoadingRecords] = useState<boolean>(true);
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      setLoadingRecords(true);
      try {
        // Format dates for the API call
        const formattedStartDate = startDate;
        const formattedEndDate = endDate;
        
        // Fetch attendance records from API
        const response = await fetch(`/api/hr/employees?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
        if (!response.ok) {
          throw new Error('Failed to fetch attendance records');
        }
        
        const data = await response.json();
        const employeesData = data.data || [];
        
        // Extract unique departments for filter dropdown
        const uniqueDepartments = Array.from(
          new Set(employeesData.map((emp: Employee) => emp.department))
        ) as string[];
        setDepartments(uniqueDepartments);
        
        // Process data to group attendance records by employee
        const processedData = employeesData.map((employee: any) => {
          // Format dates and calculate hours worked for each record
          const formattedRecords = (employee.attendance || []).map((record: any) => {
            let hoursWorked = 0;
            if (record.clockIn && record.clockOut) {
              const clockIn = new Date(record.clockIn);
              const clockOut = new Date(record.clockOut);
              hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
            }
            
            return {
              ...record,
              date: new Date(record.date),
              clockIn: record.clockIn ? new Date(record.clockIn) : undefined,
              clockOut: record.clockOut ? new Date(record.clockOut) : undefined,
              hoursWorked: hoursWorked.toFixed(2),
            };
          })
          // Filter records to only include those in the selected date range
          .filter((record: any) => {
            const recordDate = new Date(record.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the full end date
            return recordDate >= start && recordDate <= end;
          })
          // Sort records by date (most recent first)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          return {
            employee: {
              _id: employee._id,
              name: employee.name,
              department: employee.department,
              role: employee.role,
              email: employee.email,
              status: employee.status,
            },
            records: formattedRecords,
          };
        });
        
        setAttendanceData(processedData);
        setFilteredData(processedData);
        setLoadingRecords(false);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        setLoadingRecords(false);
      }
    };

    if (!loading) {
      fetchAttendanceRecords();
    }
  }, [startDate, endDate, loading]);

  // Apply filters
  useEffect(() => {
    let filtered = [...attendanceData];
    
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(item => item.employee.department === departmentFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (statusFilter === 'present') {
          return item.records.some(r => r.status === 'present');
        } else if (statusFilter === 'absent') {
          return item.records.some(r => r.status === 'absent');
        } else if (statusFilter === 'leave') {
          return item.records.some(r => r.status === 'leave');
        } else if (statusFilter === 'late') {
          return item.records.some(r => {
            if (r.clockIn) {
              const clockInTime = new Date(r.clockIn);
              // Assuming 9:00 AM is the start time
              const startTime = new Date(clockInTime);
              startTime.setHours(9, 0, 0, 0);
              return clockInTime > startTime;
            }
            return false;
          });
        }
        return true;
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [departmentFilter, statusFilter, attendanceData, searchTerm]);

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
    let csvContent = "Employee Name,Department,Role,Date,Clock In,Clock Out,Hours Worked,Status\n";
    
    filteredData.forEach(item => {
      item.records.forEach(record => {
        csvContent += [
          item.employee.name,
          item.employee.department,
          item.employee.role,
          record.date ? formatDate(new Date(record.date)) : '',
          record.clockIn ? formatTime(new Date(record.clockIn)) : 'Not Clocked In',
          record.clockOut ? formatTime(new Date(record.clockOut)) : 'Not Clocked Out',
          record.hoursWorked || '0',
          record.status
        ].join(',') + "\n";
      });
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiCalendar className="dark:text-gray-300" /> Attendance Records
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
          {/* Search by employee name */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name"
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md block w-full pl-10 p-2"
              />
            </div>
          </div>
          
          {/* Department filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500 dark:text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1 text-sm"
            >
              <option value="all">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          {/* Status filter */}
          <div className="flex items-center gap-2">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.length > 0 ? (
                filteredData.flatMap(item => 
                  item.records.map((record, idx) => (
                    <tr key={`${item.employee._id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white">{item.employee.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{item.employee.department}</td>
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
                )
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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