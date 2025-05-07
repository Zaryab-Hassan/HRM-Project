'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected'; // Updated to match schema
  createdAt: string;
}

export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leave');
      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }
      const data = await response.json();
      setLeaveRequests(data.data);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (requestId: string, status: 'Approved' | 'Rejected') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leave/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${status} leave request`);
      }

      // Refresh the leave requests
      await fetchLeaveRequests();
    } catch (err) {
      console.error(`Error ${status}ing leave request:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${status} leave request`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Leave Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
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
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {leaveRequests.length > 0 ? (
                  leaveRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                        <div>
                          <div className="font-medium">{request.employeeId.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{request.employeeId.email}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'Pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLeaveAction(request._id, 'Approved')}
                              className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                              title="Approve"
                            >
                              <FiCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleLeaveAction(request._id, 'Rejected')}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                              title="Reject"
                            >
                              <FiXCircle className="w-5 h-5" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
