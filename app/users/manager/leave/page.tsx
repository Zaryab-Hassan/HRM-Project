'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  employeeName?: string; // Added for direct DB access
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected'; // Updated to match schema
  createdAt: string;
  approvedBy?: string | null;
  approvalDate?: string | null;
}

export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [displayedRequests, setDisplayedRequests] = useState<LeaveRequest[]>([]);  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // To track which request is being processed
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  useEffect(() => {
    fetchLeaveRequests();
  }, []);
    // Update displayed requests when all requests, visible count or filter changes
  useEffect(() => {
    updateDisplayedRequests(leaveRequests, visibleCount);
  }, [leaveRequests, visibleCount, statusFilter]);  const fetchLeaveRequests = async () => {
    try {      setLoading(true);
      const response = await fetch('/api/leave?source=leaveRequest.db');
      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }      
      const data = await response.json();
      
      // Debug the response data
      console.log('Leave requests data:', data);      // Check if data.data exists and is an array
      if (!data.data || !Array.isArray(data.data)) {
        console.error('Unexpected data format:', data);
        throw new Error('Invalid data format from API');
      }
      
      // Sort by createdAt date (most recent first)
      const sortedData = [...data.data].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Log the first item to understand its structure
      if (sortedData.length > 0) {
        console.log('Sample leave request item:', sortedData[0]);
      }
      
      setLeaveRequests(sortedData);
      
      // Initialize displayed requests based on visible count
      updateDisplayedRequests(sortedData, visibleCount);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };
    // Helper function to update displayed requests
  const updateDisplayedRequests = (requests: LeaveRequest[], count: number) => {
    // First apply status filter if not 'All'
    const filteredRequests = statusFilter === 'All'
      ? requests
      : requests.filter(request => request.status === statusFilter);
      
    // Then slice to limit number of displayed items
    setDisplayedRequests(filteredRequests.slice(0, count));
  };
    // Handle showing more records
  const handleShowMore = () => {
    const newVisibleCount = visibleCount + 20;
    setVisibleCount(newVisibleCount);
  };  const handleLeaveAction = async (requestId: string, status: 'Approved' | 'Rejected') => {
    try {
      setActionLoading(requestId); // Set which request is being processed
      console.log(`Processing request ${requestId} with status: ${status}`);
      
      const response = await fetch(`/api/leave/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      console.log(`Response status: ${response.status}`);      // Parse response JSON once
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (!response.ok) {
        console.error('Error response:', responseData);
        throw new Error(responseData.error || `Failed to ${status} leave request`);
      }
      
      // If we're here, the response was successful
      console.log('Updated leave request:', responseData);// Show success message
      const statusAction = status === 'Approved' ? 'approved' : 'rejected';
      const successMessage = `Leave request successfully ${statusAction}.`;
      setSuccess(successMessage);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the leave requests
      await fetchLeaveRequests();
      
      // Reset visible count if filtering by status
      if (statusFilter === 'Pending') {
        // If we were viewing pending requests, switch to viewing the relevant status
        setStatusFilter(status);
      }
      
      // Reset any errors
      setError(null);    } catch (err) {
      console.error(`Error ${status}ing leave request:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${status} leave request`);
    } finally {
      setActionLoading(null); // Clear the action loading state
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }
  // Calculate stats for leave requests
  const pendingCount = leaveRequests.filter(req => req.status === 'Pending').length;
  const approvedCount = leaveRequests.filter(req => req.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter(req => req.status === 'Rejected').length;
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Leave Management</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Records: {leaveRequests.length}
          </div>
        </div>        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">
              ✕
            </button>
          </div>
        )}
          {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">          <div 
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-between cursor-pointer transition-all duration-200 ${statusFilter === 'Pending' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => {
              setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending');
              setError(null);
              setSuccess(null);
            }}
          >
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{pendingCount}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <FiClock className="text-yellow-500 dark:text-yellow-400" size={24} />
            </div>
          </div>
            <div 
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-between cursor-pointer transition-all duration-200 ${statusFilter === 'Approved' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => {
              setStatusFilter(statusFilter === 'Approved' ? 'All' : 'Approved');
              setError(null);
              setSuccess(null);
            }}
          >
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-500 dark:text-green-400">{approvedCount}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <FiCheckCircle className="text-green-500 dark:text-green-400" size={24} />
            </div>
          </div>
            <div 
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-between cursor-pointer transition-all duration-200 ${statusFilter === 'Rejected' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => {
              setStatusFilter(statusFilter === 'Rejected' ? 'All' : 'Rejected');
              setError(null);
              setSuccess(null);
            }}
          >
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">{rejectedCount}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
              <FiXCircle className="text-red-500 dark:text-red-400" size={24} />
            </div>
          </div>
        </div>
        
        {/* Filter indicator */}
        {statusFilter !== 'All' && (
          <div className="mb-4 flex justify-between items-center">
            <div className="bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-md text-blue-700 dark:text-blue-200 flex items-center">
              <span>Filtered by: {statusFilter}</span>              <button 
                onClick={() => {
                  setStatusFilter('All');
                  setError(null);
                  setSuccess(null);
                }} 
                className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100"
              >
                Clear
              </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {displayedRequests.length} of {statusFilter === 'All' 
                ? leaveRequests.length 
                : leaveRequests.filter(r => r.status === statusFilter).length} records
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {displayedRequests.length > 0 ? (
                  displayedRequests.map((request) => (
                    <tr key={request._id}>                      <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                        <div>
                          <div className="font-medium">
                            {typeof request.employeeId === 'object' && request.employeeId !== null
                              ? request.employeeId.name 
                              : request.employeeName || 'Unknown Employee'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {typeof request.employeeId === 'object' && request.employeeId !== null
                              ? request.employeeId.email 
                              : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                        {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                      </td>
                      <td className="px-6 py-4 dark:text-gray-300">
                        {request.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'Approved' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          request.status === 'Rejected' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                          'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">                        {request.status === 'Pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLeaveAction(request._id, 'Approved')}
                              className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                              disabled={actionLoading !== null}
                              title="Approve"
                            >
                              {actionLoading === request._id ? (
                                <div className="w-5 h-5 border-t-2 border-green-600 border-solid rounded-full animate-spin"></div>
                              ) : (
                                <FiCheckCircle className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleLeaveAction(request._id, 'Rejected')}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                              disabled={actionLoading !== null}
                              title="Reject"
                            >
                              {actionLoading === request._id ? (
                                <div className="w-5 h-5 border-t-2 border-red-600 border-solid rounded-full animate-spin"></div>
                              ) : (
                                <FiXCircle className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No leave requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
              {/* Show more button */}
            {(statusFilter === 'All' ? 
              leaveRequests.length : 
              leaveRequests.filter(r => r.status === statusFilter).length) > visibleCount && (
              <div className="mt-4 text-center">
                <button 
                  onClick={handleShowMore}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition-colors duration-300"
                >
                  Show More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
