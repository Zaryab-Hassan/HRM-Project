'use client';

import { FiClock, FiCalendar, FiX, FiChevronRight, FiChevronLeft, FiDownload } from 'react-icons/fi';
import { useState, useEffect } from 'react';

type AttendanceRecord = {
  _id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'leave';
  hoursWorked?: number;
  autoClockOut: boolean;
  notes?: string;
  employeeId?: string;
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
  clockedOutToday?: boolean;
  clockInTime?: string;
  clockOutTime?: string;
};

interface TodaysAttendanceProps {
  employees: Employee[];
  loading: boolean;
}

export default function TodaysAttendance({ employees, loading }: TodaysAttendanceProps) {
  // State for managing selected employee and their attendance records
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    end: new Date() // Today
  });
  const recordsPerPage = 10;
  
  // Filter out terminated employees
  const activeEmployees = employees.filter(employee => employee.status !== 'Terminated');

  // Function to determine if an employee is late (assume 9:00 AM is the cutoff)
  const isLateClockIn = (clockInTime: string | undefined) => {
    if (!clockInTime) return false;
    
    // Extract hours and minutes from clockInTime string
    const match = clockInTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return false;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Compare with 9:00 AM (9 hours, 0 minutes)
    return (hours > 9 || (hours === 9 && minutes > 0));
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format ISO date string to YYYY-MM-DD
  const formatISODate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Fetch attendance records for the employee based on date range
  const fetchEmployeeAttendance = async (employee: Employee, startDate: Date, endDate: Date) => {
    setIsLoading(true);
    
    try {
      const formattedStartDate = formatISODate(startDate);
      const formattedEndDate = formatISODate(endDate);
      
      // Fetch attendance records for this employee with date range
      const response = await fetch(
        `/api/employee/attendance?employeeId=${employee._id}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      
      const data = await response.json();
      
      // Sort records by date (most recent first)
      const sortedRecords = [...(data.data || [])].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAttendanceRecords(sortedRecords);
      
      // If we received less records than expected, there may not be more to load
      setHasMoreRecords(sortedRecords.length >= 15);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle click on employee row
  const handleEmployeeClick = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
    setCurrentPage(1);
    
    // Reset date range to last 14 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    setDateRange({ start: startDate, end: endDate });
    await fetchEmployeeAttendance(employee, startDate, endDate);
  };
  
  // Load more attendance history
  const loadMoreHistory = async () => {
    if (!selectedEmployee || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    try {
      // Calculate new date range
      // Get 15 more days before the current start date
      const newStartDate = new Date(dateRange.start.getTime() - 15 * 24 * 60 * 60 * 1000);
      
      const formattedStartDate = formatISODate(newStartDate);
      const formattedEndDate = formatISODate(dateRange.start);
      
      // Fetch attendance records for the extended period
      const response = await fetch(
        `/api/employee/attendance?employeeId=${selectedEmployee._id}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch more attendance records');
      }
      
      const data = await response.json();
      const newRecords = data.data || [];
      
      // If we received less records than expected, there are no more to load
      setHasMoreRecords(newRecords.length >= 15);
      
      // Sort and combine with existing records
      const combinedRecords = [...attendanceRecords];
      
      newRecords.forEach((record: AttendanceRecord) => {
        // Check if this record is already in our list (avoid duplicates)
        const exists: boolean = combinedRecords.some((existingRecord: AttendanceRecord) => 
          existingRecord._id === record._id || 
          (existingRecord.date === record.date && existingRecord.employeeId === record.employeeId)
        );
        
        if (!exists) {
          combinedRecords.push(record);
        }
      });
      
      // Sort combined records
      const sortedRecords = combinedRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAttendanceRecords(sortedRecords);
      setDateRange(prev => ({ ...prev, start: newStartDate }));
    } catch (error) {
      console.error('Error fetching more attendance records:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Export attendance history to CSV
  const exportAttendanceHistory = () => {
    if (!selectedEmployee || attendanceRecords.length === 0) return;
    
    // Prepare CSV content
    let csvContent = "Date,Clock In,Clock Out,Hours Worked,Status,Auto Clock Out\n";
    
    attendanceRecords.forEach(record => {
      const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        const time = new Date(timeStr);
        return time.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      };
      
      const getHoursWorked = () => {
        if (record.clockIn && record.clockOut) {
          const clockIn = new Date(record.clockIn);
          const clockOut = new Date(record.clockOut);
          const diff = Math.abs(clockOut.getTime() - clockIn.getTime());
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          return `${hours}h ${minutes}m`;
        }
        return '';
      };
      
      const date = formatDate(record.date);
      const clockIn = formatTime(record.clockIn);
      const clockOut = formatTime(record.clockOut);
      const hoursWorked = getHoursWorked();
      const status = record.status;
      const autoClockOut = record.autoClockOut ? 'Yes' : 'No';
      
      csvContent += `${date},${clockIn},${clockOut},${hoursWorked},${status},${autoClockOut}\n`;
    });
    
    // Create a download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEmployee.name}-attendance-history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };
  
  // Pagination controls
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = attendanceRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(attendanceRecords.length / recordsPerPage);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8">
      <div className="p-6 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiClock className="dark:text-gray-300" /> Today's Attendance
        </h2>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            ))}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {activeEmployees.map((employee) => (
                <tr
                  key={employee._id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${employee.clockedInToday && !employee.clockedOutToday ? 'bg-green-50 dark:bg-green-900/20' : ''
                    }`}
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <td className="px-6 py-4 whitespace-nowrap dark:text-white">{employee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.clockedInToday ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                        {employee.clockInTime || 'Clocked In'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 mr-1 bg-gray-400 rounded-full"></span>
                        Not Clocked In
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.clockedOutToday ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        <span className="w-2 h-2 mr-1 bg-blue-500 rounded-full"></span>
                        {employee.clockOutTime || 'Clocked Out'}
                      </span>
                    ) : (
                      employee.clockedInToday ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          <span className="w-2 h-2 mr-1 bg-yellow-500 rounded-full"></span>
                          Still Working
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          <span className="w-2 h-2 mr-1 bg-gray-400 rounded-full"></span>
                          Not Clocked Out
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!employee.clockedInToday ? (
                      employee.status === 'On Leave' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          On Leave
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Absent
                        </span>
                      )
                    ) : isLateClockIn(employee.clockInTime) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                        Late
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        On Time
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && activeEmployees.length === 0 && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">No employees found</div>
      )}
      
      {/* Modal for displaying attendance records */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <FiCalendar className="mr-2" /> Attendance History - {selectedEmployee.name}
                </h3>
                <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(dateRange.start.toISOString())} - {formatDate(dateRange.end.toISOString())}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={exportAttendanceHistory}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center text-sm"
                  title="Export to CSV"
                >
                  <FiDownload className="mr-1" /> Export
                </button>
                <button 
                  onClick={handleCloseModal} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No attendance records found for this employee
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clock Out</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentRecords.map((record) => {
                      // Format the time from ISO string
                      const formatTime = (timeStr?: string) => {
                        if (!timeStr) return '-';
                        
                        const time = new Date(timeStr);
                        return time.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                      };
                      
                      // Calculate hours worked (if both clock in and out exist)
                      const getHoursWorked = () => {
                        if (record.clockIn && record.clockOut) {
                          const clockIn = new Date(record.clockIn);
                          const clockOut = new Date(record.clockOut);
                          const diff = Math.abs(clockOut.getTime() - clockIn.getTime());
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${minutes}m`;
                        }
                        return '-';
                      };

                      return (
                        <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 whitespace-nowrap dark:text-white">{formatDate(record.date)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {record.clockIn ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                {formatTime(record.clockIn)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {record.clockOut ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                {formatTime(record.clockOut)}
                                {record.autoClockOut && <span className="ml-1 text-yellow-600">(Auto)</span>}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap dark:text-white">
                            {getHoursWorked()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {record.status === 'present' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                Present
                              </span>
                            ) : record.status === 'leave' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                Leave
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                                Absent
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              
              {/* Load more button */}
              {!isLoading && hasMoreRecords && (
                <div className="text-center mt-4">
                  <button
                    onClick={loadMoreHistory}
                    disabled={isLoadingMore}
                    className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 rounded-full"></span>
                        Loading...
                      </span>
                    ) : (
                      'Load Previous Records'
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {!isLoading && attendanceRecords.length > 0 && (
              <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, attendanceRecords.length)} of {attendanceRecords.length} records
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded ${
                      currentPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="py-2 px-3 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200 rounded">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded ${
                      currentPage === totalPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}