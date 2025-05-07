"use client";
import Link from "next/link";
import { 
  FiHome, 
  FiUser, 
  FiCalendar, 
  FiDollarSign, 
  FiMail,
  FiClipboard,
  FiBell,
  FiCreditCard,
  FiLogOut
} from "react-icons/fi";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const EmployeeSidebar = () => {
  const pathname = usePathname();

  // Function to handle user logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="fixed w-64 h-full p-4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-10 overflow-y-auto">
      <div className="flex items-center mb-8 p-2">
        <FiHome className="text-2xl mr-3 text-pink-500" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Employee Portal</h1>
      </div>

      {/* Main Navigation */}
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold mb-3 dark:text-gray-300">Main Navigation</h2>
        <div className="space-y-1">
          <Link href="/users/employee" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname === "/users/employee" 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiHome className="mr-3" />
            <span>Dashboard</span>
          </Link>

          <Link href="/users/employee/profile" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/employee/profile") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiUser className="mr-3" />
            <span>Profile</span>
          </Link>

          <Link href="/users/employee/attendance" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/employee/attendance") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiCalendar className="mr-3" />
            <span>Attendance</span>
          </Link>

          <Link href="/users/employee/leave" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/employee/leave") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiClipboard className="mr-3" />
            <span>Leave</span>
          </Link>

          <Link href="/users/employee/loan" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/employee/loan") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiCreditCard className="mr-3" />
            <span>Loan</span>
          </Link>

          <Link href="/users/employee/payroll" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/employee/payroll") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiDollarSign className="mr-3" />
            <span>Payroll</span>
          </Link>
          
          <Link href="/users/employee/announcements" 
            className={`flex items-center w-full p-3 rounded-lg transition ${
              pathname.includes("/users/employee/announcements") 
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
            <FiMail className="mr-3" />
            <span>Announcements</span>
          </Link>
        </div>
      </div>

      {/* User Actions */}
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold mb-3 dark:text-gray-300">User Menu</h2>
        <div className="space-y-1">
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

export default EmployeeSidebar;