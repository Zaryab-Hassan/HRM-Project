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
  FiSearch
} from "react-icons/fi";
import PendingLeaveRequests from "../../../components/PendingLeaveRequests";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type SummaryStats = {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  totalPayroll: number;
  birthdaysToday: string[];
};

type LeaveRequest = {
  _id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: string;
  createdAt: string;
};

type Employee = {
  _id: string;
  name: string;
  department: string;
  role: string;
  status?: 'Added';
};

export default function ManagerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Check authentication and authorization
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session?.user?.role !== "manager") {
      // Redirect non-manager users
      router.push("/users/" + (session?.user?.role || "employee"));
    }
  }, [status, session, router]);

  // Don't render the dashboard until we confirm the user is a manager
  if (status === "loading" || status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "manager")) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryStatsRes, leaveRequestsRes] = await Promise.all([
          fetch("/api/manager/summary"),
          fetch("/api/leave") // This endpoint already handles team-based filtering for managers
        ]);

        if (!summaryStatsRes.ok || !leaveRequestsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const summaryData = await summaryStatsRes.json();
        const leaveData = await leaveRequestsRes.json();
        setSummaryStats(summaryData);
        setLeaveRequests(leaveData);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      }
    }
    fetchData();
  }, []);

  const handleAddEmployee = async (employeeId: string) => {
    try {
      const response = await fetch('/api/manager/team/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      // Update stats after successful addition
      if (summaryStats) {
        setSummaryStats({
          ...summaryStats,
          totalEmployees: summaryStats.totalEmployees + 1
        });
      }

      // Mark the employee as added
      setAvailableEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp._id === employeeId ? { ...emp, status: 'Added' } : emp
        )
      );

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
    }
  };
  const handleOpenAddModal = async () => {
    try {
      // Changed to fetch all employees instead of just available ones
      const response = await fetch('/api/employee/profile');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      setAvailableEmployees(data.employees || data);
      setShowAddModal(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    }
  };

  const filteredEmployees = availableEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Rest of your existing functions
  const handleApproveLeave = async (requestId: string) => {
    try {
      const response = await fetch('/api/manager/leave-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, status: 'Approved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve leave request');
      }

      const updatedRequest = await response.json();
      
      // Update local state
      setLeaveRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === requestId ? updatedRequest : request
        )
      );

      // Update summary stats
      if (summaryStats) {
        setSummaryStats({
          ...summaryStats,
          pendingLeaves: summaryStats.pendingLeaves - 1
        });
      }
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve leave');
    }
  };

  const handleRejectLeave = async (requestId: string) => {
    try {
      const response = await fetch('/api/manager/leave-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, status: 'Rejected' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject leave request');
      }

      const updatedRequest = await response.json();
      
      // Update local state
      setLeaveRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === requestId ? updatedRequest : request
        )
      );

      // Update summary stats
      if (summaryStats) {
        setSummaryStats({
          ...summaryStats,
          pendingLeaves: summaryStats.pendingLeaves - 1
        });
      }
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject leave');
    }
  };

  // Handle posting a new announcement
  const handlePostAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const urgency = formData.get('urgency') as string;
    const sendEmail = formData.get('sendEmail') === 'on';
    
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          category,
          urgency,
          sendEmail
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post announcement');
      }
      
      // Show success message and close modal
      alert('Announcement posted successfully!');
      setShowAnnouncementModal(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post announcement');
    }
  };
  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="fixed w-64 h-full p-4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center mb-8 p-2">
          <FiHome className="text-2xl mr-3 text-pink-500" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Manager Dashboard</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-sm uppercase font-semibold mb-4 dark:text-gray-300">Quick Actions</h2>
          <div className="space-y-2">            <button 
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center w-full p-3 rounded-lg bg-opacity-10 hover:bg-opacity-20 transition dark:hover:bg-gray-700">
              <FiCheck className="mr-3 text-pink-500" />
              <span className="dark:text-gray-300">Approve Leaves</span>
            </button>            <button 
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center w-full p-3 rounded-lg bg-opacity-10 hover:bg-opacity-20 transition dark:hover:bg-gray-700">
              <FiMail className="mr-3 text-pink-500" />
              <span className="dark:text-gray-300">Post Announcement</span>
            </button>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center w-full p-3 rounded-lg bg-opacity-10 hover:bg-opacity-20 transition dark:hover:bg-gray-700"
            >
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

      {/* Main content */}
      <div className="flex-1 p-8 ml-64">
        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-white">View All Employees</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Department
                      </th>                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee._id}>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                          {employee.department}
                        </td>                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                          {employee.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left text-gray-500 dark:text-gray-300">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Approve Leaves Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-white">Approve Leave Requests</h2>
                <button 
                  onClick={() => setShowLeaveModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <FiCalendar className="mr-2 text-pink-600" />
                    Pending Leave Requests
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <PendingLeaveRequests 
                    leaveRequests={leaveRequests} 
                    onApproveAction={handleApproveLeave} 
                    onRejectAction={handleRejectLeave} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white flex items-center">
                  <FiMail className="mr-2 text-pink-500" />
                  Post Announcement
                </h2>
                <button 
                  onClick={() => setShowAnnouncementModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handlePostAnnouncement}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Enter announcement title"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select a category</option>
                      <option value="Company News">Company News</option>
                      <option value="Benefits">Benefits</option>
                      <option value="Events">Events</option>
                      <option value="IT Updates">IT Updates</option>
                      <option value="Policies">Policies</option>
                      <option value="Recognition">Recognition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Urgency
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input type="radio" name="urgency" value="low" className="form-radio text-pink-500" />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Low</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input type="radio" name="urgency" value="medium" className="form-radio text-pink-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Medium</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input type="radio" name="urgency" value="high" className="form-radio text-pink-500" />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">High</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content
                    </label>
                    <textarea
                      name="content"
                      rows={5}
                      placeholder="Enter announcement details..."
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    ></textarea>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <div className="flex items-center">
                      <input
                        id="sendEmail"
                        name="sendEmail"
                        type="checkbox"
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Send email notification
                      </label>
                    </div>
                  </div>

                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAnnouncementModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:focus:ring-offset-gray-800"
                  >
                    Post Announcement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rest of your existing JSX */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
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
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
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
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
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
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
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
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold flex items-center dark:text-white">
              <FiCalendar className="mr-2 text-pink-600" />
              Pending Leave Requests
            </h2>
          </div>
          <PendingLeaveRequests 
            leaveRequests={leaveRequests} 
            onApproveAction={handleApproveLeave} 
            onRejectAction={handleRejectLeave} 
          />
        </div>

        {/* Notifications Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    <li key={request._id} className="p-3 bg-yellow-50 dark:bg-gray-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-gray-600 transition">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 dark:bg-gray-600 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            {request.employeeName.charAt(0)}
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