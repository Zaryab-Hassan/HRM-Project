"use client";
import { useState, useEffect } from "react";
import { 
  FiHome, 
  FiUsers, 
  FiCalendar, 
  FiDollarSign, 
  FiMail,
  FiCheck, 
  FiX,
  FiUserPlus,
  FiBell,
} from "react-icons/fi";

// type Employee = {
//   id: number;
//   name: string;
//   position: string;
//   department: string;
//   attendance: string;
//   leaves: number;
//   salary: number;
//   loanStatus: string;
// };

type SummaryStats = {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  totalPayroll: number;
  birthdaysToday: string[];
};

type LeaveRequest = {
  id: number;
  name: string;
  date: string;
  reason: string;
  status: string;
};

export default function ManagerDashboard() {
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    async function fetchData() {
      const summaryStats = await fetch("/Summarystats.json");
      setSummaryStats(await summaryStats.json());
      const leaveRequests = await fetch("/leaverequests.json");
      setLeaveRequests(await leaveRequests.json());
    }
    fetchData();
  }, []);

  const handleApproveLeave = (id: number) => {
    setLeaveRequests(leaveRequests.map(request => 
      request.id === id ? { ...request, status: "Approved" } : request
    ));
  };

  const handleRejectLeave = (id: number) => {
    setLeaveRequests(leaveRequests.map(request => 
      request.id === id ? { ...request, status: "Rejected" } : request
    ));
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="fixed w-64 h-full p-4 shadow-lg z-10 bg-white dark:bg-gray-800">
        <div className="flex items-center mb-8 p-2">
          <FiHome className="text-2xl mr-3 text-pink-500" />
          <h1 className="text-xl font-bold dark:text-white">Manager Dashboard</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-sm uppercase font-semibold mb-4 dark:text-gray-300">Quick Actions</h2>
          <div className="space-y-2">
            <button className="flex items-center w-full p-3 rounded-lg bg-opacity-10 hover:bg-opacity-20 transition dark:hover:bg-gray-700">
              <FiCheck className="mr-3 text-pink-500" />
              <span className="dark:text-gray-300">Approve Leaves</span>
            </button>
            <button className="flex items-center w-full p-3 rounded-lg bg-opacity-10 hover:bg-opacity-20 transition dark:hover:bg-gray-700">
              <FiMail className="mr-3 text-pink-500" />
              <span className="dark:text-gray-300">Post Announcement</span>
            </button>
            <button className="flex items-center w-full p-3 rounded-lg bg-opacity-10 hover:bg-opacity-20 transition dark:hover:bg-gray-700">
              <FiUserPlus className="mr-3 text-pink-500" />
              <span className="dark:text-gray-300">Add Employee</span>
            </button>
            <button className="flex items-center w-full p-3 rounded-lg bg-opacity-10 hover:bg-opacity-20 transition dark:hover:bg-gray-700">
              <FiDollarSign className="mr-3 text-pink-500" />
              <span className="dark:text-gray-300">Generate Payroll</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 ml-64">
        {/* Summary Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Employees</h3>
                  <p className="text-2xl font-bold mt-1 dark:text-white">{summaryStats?.totalEmployees}</p>
                </div>
                <div className="p-3 rounded-lg bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400">
                  <FiUsers className="text-xl" />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Present Today</h3>
                  <p className="text-2xl font-bold mt-1 dark:text-white">{summaryStats?.presentToday}</p>
                  <p className="text-green-500 dark:text-green-400 text-sm mt-1">
                    {summaryStats && ((summaryStats.presentToday / summaryStats.totalEmployees) * 100).toFixed(1)}% attendance
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-gray-700 text-green-600 dark:text-green-400">
                  <FiCheck className="text-xl" />
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Leaves</h3>
                  <p className="text-2xl font-bold mt-1 dark:text-white">{summaryStats?.pendingLeaves}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-gray-700 text-yellow-600 dark:text-yellow-400">
                  <FiCalendar className="text-xl" />
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Monthly Payroll</h3>
                  <p className="text-2xl font-bold mt-1 dark:text-white">
                    ${summaryStats?.totalPayroll.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400">
                  <FiDollarSign className="text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center dark:text-white">
              <FiCalendar className="mr-2 text-pink-600" />
              Pending Leave Requests
            </h2>
          </div>
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
                {leaveRequests.filter(req => req.status === "Pending").map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 dark:bg-gray-600 flex items-center justify-center text-pink-600 dark:text-pink-400">
                          {request.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{request.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {request.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {request.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproveLeave(request.id)}
                        className="mr-3 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 flex items-center"
                      >
                        <FiCheck className="mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(request.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 flex items-center"
                      >
                        <FiX className="mr-1" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center dark:text-white">
              <FiBell className="mr-2 text-pink-600" />
              Notifications
            </h2>
          </div>
          <div className="p-6">
            {/* Birthdays */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                <span className="h-2 w-2 bg-pink-500 rounded-full mr-2"></span>
                Birthdays Today
              </h3>
              {summaryStats?.birthdaysToday.length ? (
                <ul className="space-y-3">
                  {summaryStats.birthdaysToday.map(name => (
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

            {/* Pending Approvals */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
                Pending Approvals
              </h3>
              {leaveRequests.filter(req => req.status === "Pending").length ? (
                <ul className="space-y-3">
                  {leaveRequests.filter(req => req.status === "Pending").map(request => (
                    <li key={request.id} className="p-3 bg-yellow-50 dark:bg-gray-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-gray-600 transition">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 dark:bg-gray-600 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            {request.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{request.name}</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">{request.reason}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{request.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm pl-4">No pending approvals</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}