"use client";
import Link from "next/link";
import { 
  FiHome, 
  FiUsers, 
  FiCalendar, 
  FiDollarSign, 
  FiMail,
  FiUserPlus,
  FiCheck,
  FiClipboard,
  FiSettings,
  FiBell,
  FiSearch,
  FiUser,
  FiLogOut,
  FiX
} from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const ManagerSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navigateWithQuery = (path: string, query: string) => {
    // If we're already on the same path, use window.history to add query parameters without reloading
    if (pathname === path) {
      // Update URL without causing a reload
      window.history.pushState({}, '', `${path}?${query}`);
      
      // Manually trigger the query parameter check - this simulates what would happen after navigation
      const params = new URLSearchParams(query);
      if (params.has('showRegistrationModal')) {
        window.dispatchEvent(new CustomEvent('show-registration-modal'));
      }
      if (params.has('showLeaveModal')) {
        window.dispatchEvent(new CustomEvent('show-leave-modal'));
      }
      if (params.has('showAnnouncementModal')) {
        window.dispatchEvent(new CustomEvent('show-announcement-modal'));
      }
    } else {
      // Use router for other navigations
      router.push(`${path}?${query}`);
    }
  };

  // Function to handle user logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="fixed w-64 h-full p-4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-10 overflow-y-auto">
      <div className="flex items-center mb-8 p-2">
        <FiHome className="text-2xl mr-3 text-pink-500" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Manager Portal</h1>
      </div>

      {/* Main Navigation */}
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold mb-3 dark:text-gray-300">Main Navigation</h2>
        <div className="space-y-1">
          <Link href="/users/manager" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname === "/users/manager" 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiHome className="mr-3" />
            <span>Dashboard</span>
          </Link>

          <Link href="/users/manager/usermanagement" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/manager/usermanagement") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiUsers className="mr-3" />
            <span>User Management</span>
          </Link>

          <Link href="/users/manager/attendancemanagement" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/manager/attendancemanagement") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiCalendar className="mr-3" />
            <span>Attendance</span>
          </Link>

          <Link href="/users/manager/payrollmanagement" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/manager/payrollmanagement") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiDollarSign className="mr-3" />
            <span>Payroll</span>
          </Link>

          <Link href="/users/manager/leave" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/manager/leave") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiClipboard className="mr-3" />
            <span>Leave Management</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold mb-3 dark:text-gray-300">Quick Actions</h2>
        <div className="space-y-1">
          <button 
            className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition text-left"
            onClick={() => navigateWithQuery("/users/manager", "showRegistrationModal=true")}
          >
            <FiUserPlus className="mr-3 text-pink-500" />
            <span>Register Employee</span>
          </button>
          
          <button 
            className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition text-left"
            onClick={() => navigateWithQuery("/users/manager", "showLeaveModal=true")}>
            <FiCheck className="mr-3 text-pink-500" />
            <span>Approve Leaves</span>
          </button>
          
          <button 
            className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition text-left"
            onClick={() => navigateWithQuery("/users/manager", "showAnnouncementModal=true")}>
            <FiMail className="mr-3 text-pink-500" />
            <span>Post Announcement</span>
          </button>
          
          <button 
            className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition text-left">
            <FiBell className="mr-3 text-pink-500" />
            <span>Notifications</span>
          </button>
        </div>
      </div>

      {/* User Menu */}
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold mb-3 dark:text-gray-300">User Menu</h2>
        <div className="space-y-1">
          <Link href="/users/manager/myprofile" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/manager/profile") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiUser className="mr-3" />
            <span>Profile</span>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition text-left">
            <FiLogOut className="mr-3 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Footer with current date */}
      <div className="absolute bottom-4 left-4 right-4 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        {new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  );
};

export default ManagerSidebar;