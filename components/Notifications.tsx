import React from 'react';
import { FiBell, FiCalendar, FiMail } from 'react-icons/fi';

type NotificationProps = {
  birthdaysToday: string[];
  pendingApprovals?: any[];
  userLeaveRequests?: any[];
  recentAnnouncements?: any[];
  isEmployee?: boolean;
};

const Notifications: React.FC<NotificationProps> = ({ 
  birthdaysToday, 
  pendingApprovals = [], 
  userLeaveRequests = [], 
  recentAnnouncements = [],
  isEmployee = false 
}) => {
  // Group user leave requests by status
  const pendingUserLeaves = userLeaveRequests.filter(req => req.status === 'Pending');
  const approvedUserLeaves = userLeaveRequests.filter(req => req.status === 'Approved');
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold flex items-center dark:text-white">
          <FiBell className="mr-2 text-pink-600" />
          Recent Notifications
        </h2>
      </div>
      <div className="p-6">
        {/* Recent Announcements - Show first */}
        {recentAnnouncements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
              <span className="h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
              Recent Announcements
            </h3>
            <ul className="space-y-3">
              {recentAnnouncements.map(announcement => (
                <li key={announcement._id} className="p-3 bg-blue-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full 
                        ${announcement.urgency === 'high' 
                          ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' 
                          : announcement.urgency === 'medium'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        } 
                        flex items-center justify-center`}
                      >
                        <FiMail />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{announcement.title}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {announcement.category} • By {announcement.author || 'Admin'} • {new Date(announcement.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full 
                      ${announcement.urgency === 'high' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                        : announcement.urgency === 'medium'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {announcement.urgency.charAt(0).toUpperCase() + announcement.urgency.slice(1)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Birthdays */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
            <span className="h-2 w-2 bg-pink-500 rounded-full mr-2"></span>
            Birthdays Today
          </h3>
          {birthdaysToday?.length ? (
            <ul className="space-y-3">
              {birthdaysToday.map(name => (
                <li key={name} className="flex items-center p-3 bg-pink-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-pink-100 dark:bg-gray-600 flex items-center justify-center text-pink-600 dark:text-pink-400">
                    {name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                    <p className="text-sm text-pink-600 dark:text-pink-400">Birthday Today!</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm pl-4">No birthdays today</p>
          )}
        </div>

        {/* Display pending leave requests for managers */}
        {!isEmployee && pendingApprovals && pendingApprovals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
              <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
              Pending Approvals
            </h3>
            <ul className="space-y-3">
              {pendingApprovals.map(request => (
                <li key={request._id} className="p-3 bg-yellow-50 dark:bg-gray-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-gray-600 transition">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 dark:bg-gray-600 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                        {request.employeeName?.charAt(0) || "U"}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{request.employeeName}</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">{request.reason}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(request.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Employee's Pending Leave Requests */}
        {isEmployee && pendingUserLeaves.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
              <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
              Your Pending Leave Requests
            </h3>
            <ul className="space-y-3">
              {pendingUserLeaves.map(request => (
                <li key={request._id} className="p-3 bg-yellow-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 dark:bg-gray-600 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                        <FiCalendar />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.leaveType?.charAt(0).toUpperCase() + request.leaveType?.slice(1)} Leave
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Employee's Approved Leave Requests */}
        {isEmployee && approvedUserLeaves.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
              Your Approved Leave Requests
            </h3>
            <ul className="space-y-3">
              {approvedUserLeaves.map(request => (
                <li key={request._id} className="p-3 bg-green-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-gray-600 flex items-center justify-center text-green-600 dark:text-green-400">
                        <FiCalendar />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.leaveType?.charAt(0).toUpperCase() + request.leaveType?.slice(1)} Leave
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Approved
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No pending approvals for managers */}
        {!isEmployee && (!pendingApprovals || pendingApprovals.length === 0) && (
          <p className="text-gray-400 text-sm pl-4">No pending approvals</p>
        )}

        {/* No leave requests for employees */}
        {isEmployee && userLeaveRequests.length === 0 && (
          <p className="text-gray-400 text-sm pl-4">You have no pending or approved leave requests</p>
        )}
      </div>
    </div>
  );
};

export default Notifications;