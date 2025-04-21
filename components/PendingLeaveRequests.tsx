"use client";
import { FiCheck, FiX } from "react-icons/fi";

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
  status: string; // Use string instead of enum to support case-insensitive matching
  type?: string;
  leaveType?: string;
  createdAt: string;
};

interface PendingLeaveRequestsProps {
  leaveRequests: LeaveRequest[];
  onApproveAction: (requestId: string) => void;
  onRejectAction: (requestId: string) => void;
}

export default function PendingLeaveRequests({ 
  leaveRequests, 
  onApproveAction, 
  onRejectAction 
}: PendingLeaveRequestsProps) {
  // Case-insensitive filter for pending status
  console.log("Total leave requests:", leaveRequests?.length || 0);
  
  const pendingRequests = leaveRequests?.filter(req => {
    if (!req) return false;
    
    // Handle case where status might be missing
    if (!req.status) {
      // If no status is specified, we assume it's pending
      return true;
    }
    
    // Convert to lowercase for case-insensitive comparison
    const requestStatus = req.status.toLowerCase();
    return requestStatus === 'pending';
  }) || [];
  
  // Debug logging
  console.log(`Found ${pendingRequests.length} pending leave requests`);
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => {
              // Get employee name from request, handling both string and object employeeId
              const employeeName = request.employeeName || 
                (typeof request.employeeId === 'object' && request.employeeId?.name) || 
                'Unknown';
              
              return (
                <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 dark:bg-gray-600 flex items-center justify-center text-pink-600 dark:text-pink-400">
                        {(employeeName || '?').charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{employeeName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      {request.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onApproveAction(request._id)}
                      className="mr-3 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 flex items-center"
                    >
                      <FiCheck className="mr-1" /> Approve
                    </button>
                    <button
                      onClick={() => onRejectAction(request._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 flex items-center"
                    >
                      <FiX className="mr-1" /> Reject
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No pending leave requests found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
