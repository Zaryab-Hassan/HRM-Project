"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type LeaveType = 'annual' | 'sick' | 'personal' | 'other';
type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

interface LeaveBalance {
  annual: number;
  sick: number;
  personal: number;
}

interface LeaveRequest {
  _id: string;
  createdAt: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
}

const LeaveManagement: React.FC = () => {
  const { data: session } = useSession();
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    annual: 15,
    sick: 10,
    personal: 5
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/leave');
        if (!response.ok) {
          throw new Error('Failed to fetch leave requests');
        }
        const data = await response.json();
        
        // Handle different response formats to ensure we have an array
        let requests = [];
        if (Array.isArray(data)) {
          requests = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          requests = data.data;
        } else if (data && data.requests && Array.isArray(data.requests)) {
          requests = data.requests;
        } else {
          console.warn('Unexpected API response format:', data);
          requests = []; // Default to empty array if format is unexpected
        }
        
        setLeaveRequests(requests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leave requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  // Handle delete request
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/leave/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete leave request');
      }

      setLeaveRequests(prev => prev.filter(request => request._id !== id));
      alert('Leave request deleted successfully!');
    } catch (error) {
      console.error('Error deleting leave request:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete leave request');
    }
  };

  const [newRequest, setNewRequest] = useState<Omit<LeaveRequest, '_id' | 'createdAt' | 'status'>>({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!session?.user) {
      setSubmitError('User session not found. Please log in again.');
      return;
    }

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveType: newRequest.leaveType,
          startDate: newRequest.startDate,
          endDate: newRequest.endDate,
          reason: newRequest.reason,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit leave request');
      }

      setLeaveRequests(prev => [data.data, ...prev]);
      setNewRequest({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        reason: ''
      });
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit leave request');
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {    const statusClasses = {
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Generate month options for filter
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate year options (current year and previous year)
  const years = [currentDate.getFullYear(), currentDate.getFullYear() - 1];
  
  // Filter leave requests by selected month and year
  const filteredLeaveRequests = leaveRequests.filter(request => {
    // For leave requests, check if either start date or end date falls within selected month/year
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    
    const inSelectedMonthYear = (date: Date) => {
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    };
    
    // Include if either start or end date is in the selected month/year, or if the leave spans over the selected month
    return inSelectedMonthYear(startDate) || inSelectedMonthYear(endDate) || 
           (startDate <= new Date(selectedYear, selectedMonth, 1) && 
            endDate >= new Date(selectedYear, selectedMonth + 1, 0));
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Leave Management</h1>
        
        {/* Leave Balance Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Leave Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Annual Leave</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{leaveBalance.annual} days</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Sick Leave</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{leaveBalance.sick} days</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Personal Leave</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{leaveBalance.personal} days</p>
            </div>
          </div>
        </div>
        
        {/* Request Leave Form */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Request Leave</h2>
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded dark:bg-red-900 dark:border-red-800 dark:text-red-200">
                {submitError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Leave Type
                </label>
                <select
                  id="leaveType"
                  name="leaveType"
                  value={newRequest.leaveType}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={newRequest.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={newRequest.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  value={newRequest.reason}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Submit Request
            </button>
          </form>
        </div>
        
        {/* Leave Requests Status */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">My Leave Requests</h2>
          
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
          
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                You haven't made any leave requests yet. Use the form above to submit your first request.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Request Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {filteredLeaveRequests.map(request => (
                    <tr key={request._id}>                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.startDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.endDate}
                      </td>                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">                        {request.status === 'Pending' && (
                          <button                            onClick={() => handleDelete(request._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;