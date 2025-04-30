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
  FiSearch,
  FiUser
} from "react-icons/fi";
import PendingLeaveRequests from "../../../components/PendingLeaveRequests";
import Notifications from "../../../components/Notifications";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ManagerSidebar from "@/components/ManagerSidebar";

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
  status?: 'Added' | 'Active' | 'On Leave' | 'Terminated'; 
};

export default function ManagerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [terminatingEmployee, setTerminatingEmployee] = useState<string | null>(null);
  
  // Add registration form state
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    cnic: '',
    department: '',
    role: 'employee', // Default role is employee
    email: '',
    phone: '',
    emergencyContact: '',
    dob: '',
    initialSalary: '',
    currentSalary: '',
    shift: 'Morning',
    expiryDate: ''
  });

  // Handle registration form change
  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegistrationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle employee registration
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      // Create submission data with default password as CNIC
      const submissionData = {
        ...registrationForm,
        password: registrationForm.cnic, // Set default password as CNIC
        currentSalary: registrationForm.initialSalary, // Initialize current salary same as initial
        role: 'hr' // Always set role as HR when registering from manager page
      };

      // Use employee registration endpoint
      const response = await fetch('/api/auth/register/employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Clear form on success
      setRegistrationForm({
        name: '',
        cnic: '',
        department: '',
        role: 'employee',
        email: '',
        phone: '',
        emergencyContact: '',
        dob: '',
        initialSalary: '',
        currentSalary: '',
        shift: 'Morning',
        expiryDate: ''
      });

      // Close modal and refresh dashboard
      setShowRegistrationModal(false);
      
      // Update stats after successful addition
      if (summaryStats) {
        setSummaryStats({
          ...summaryStats,
          totalEmployees: summaryStats.totalEmployees + 1
        });
      }

      alert('Employee registered successfully! Default password is set to CNIC number.');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  // Check authentication and authorization
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session?.user?.role !== "manager") {
      // Redirect non-manager users
      router.push("/users/" + (session?.user?.role || "employee"));
    }
  }, [status, session, router]);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryStatsRes, leaveRequestsRes, announcementsRes] = await Promise.all([
          fetch("/api/manager/summary"),
          fetch("/api/leave?source=leaveRequest.db"), // Explicitly request from leaveRequest.db
          fetch("/api/announcements")
        ]);

        if (!summaryStatsRes.ok || !leaveRequestsRes.ok || !announcementsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const summaryData = await summaryStatsRes.json();
        const leaveData = await leaveRequestsRes.json();
        const announcementsData = await announcementsRes.json();
        
        setSummaryStats(summaryData);
        
        console.log("Leave data received:", leaveData); // Add logging for debugging
        
        // Extract the leave requests from the response
        let leaveRequests = [];
        if (leaveData && leaveData.success && leaveData.data) {
          leaveRequests = leaveData.data;
        } else if (leaveData && Array.isArray(leaveData)) {
          leaveRequests = leaveData;
        } else if (leaveData && leaveData.requests) {
          leaveRequests = leaveData.requests;
        }
        
        console.log("Extracted leave requests:", leaveRequests); // Log the extracted requests
        setLeaveRequests(leaveRequests);
        
        // Filter announcements from the past 5 days
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        
        let announcements = Array.isArray(announcementsData) ? announcementsData : [];
        const recentOnes = announcements.filter(announcement => {
          const announcementDate = new Date(announcement.date);
          return announcementDate >= fiveDaysAgo;
        });
        
        setError('');
      } catch (err) {
        console.error("Error fetching data:", err); // Log any errors
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      }
    }
    
    // Only fetch data if the user is authenticated as a manager
    if (status === "authenticated" && session?.user?.role === "manager") {
      fetchData();
    }
  }, [status, session]);

  // Don't render the dashboard until we confirm the user is a manager
  if (status === "loading" || status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "manager")) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>;
  }

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

  // Handle terminate employee
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
      setAvailableEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp._id === employeeId ? { ...emp, status: 'Terminated' } : emp
        )
      );

      // Update summary stats if needed
      if (summaryStats) {
        // You might want to update relevant stats when an employee is terminated
        // For example, reduce total employee count if terminated employees are excluded
      }

      setError('');
      alert('Employee has been terminated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate employee');
    } finally {
      setTerminatingEmployee(null);
    }
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen overflow-hidden">
      {/* Sidebar */}
      <ManagerSidebar/>
      
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
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                          {employee.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left text-gray-500 dark:text-gray-300">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                              {employee.status === 'Terminated' ? 'Terminated' : 'Active'}
                            </span>
                            <button
                              onClick={() => handleTerminateEmployee(employee._id)}
                              disabled={employee.status === 'Terminated' || terminatingEmployee === employee._id}
                              className={`px-2 py-1 text-xs font-medium rounded-lg 
                                ${employee.status === 'Terminated' || terminatingEmployee === employee._id
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700'
                                }`}
                            >
                              {terminatingEmployee === employee._id ? 'Processing...' : 'Terminate'}
                            </button>
                          </div>
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

        {/* Register New Employee Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white flex items-center">
                  <FiUserPlus className="mr-2 text-pink-500" />
                  Register New Employee
                </h2>
                <button 
                  onClick={() => setShowRegistrationModal(false)}
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

              <form onSubmit={handleRegisterEmployee} className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                      <FiUser /> Personal Information
                    </h2>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={registrationForm.name}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CNIC*</label>
                      <input
                        type="text"
                        name="cnic"
                        value={registrationForm.cnic}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role*</label>
                      <select
                        name="role"
                        value={registrationForm.role}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="employee">Employee</option>
                        <option value="hr">HR Personnel</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Department*</label>
                      <select
                        name="department"
                        value={registrationForm.department}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      >
                        <option value="">Select Department</option>
                        <option value="Finance">Finance</option>
                        <option value="IT">IT</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email*</label>
                      <input
                        type="email"
                        name="email"
                        value={registrationForm.email}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number*</label>
                      <input
                        type="tel"
                        name="phone"
                        value={registrationForm.phone}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                      <FiDollarSign /> Employment Information
                    </h2>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Emergency Contact*</label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={registrationForm.emergencyContact}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        placeholder="Name,Phone,Relationship"
                        required
                      />
                    </div>
            
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date of Birth*</label>
                      <input
                        type="date"
                        name="dob"
                        value={registrationForm.dob}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Salary at Appointment*</label>
                      <input
                        type="number"
                        name="initialSalary"
                        value={registrationForm.initialSalary}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      />
                    </div>
            
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Shift*</label>
                      <select
                        name="shift"
                        value={registrationForm.shift}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg"
                        required
                      >
                        <option value="">Select Shift</option>
                        <option value="Morning">Morning (9AM-5PM)</option>
                        <option value="Evening">Evening (2PM-10PM)</option>
                        <option value="Night">Night (10PM-6AM)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Expiry Date*</label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={registrationForm.expiryDate}
                        onChange={handleRegistrationChange}
                        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                  >
                    Register Employee
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
                    ${summaryStats?.totalPayroll ? summaryStats.totalPayroll.toLocaleString() : '0'}
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
        <Notifications 
          birthdaysToday={summaryStats?.birthdaysToday || []} 
          pendingApprovals={Array.isArray(leaveRequests) ? leaveRequests.filter(req => req.status === 'Pending') : []} 
        />
      </div>
    </div>
  );
}


