"use client";
import Link from "next/link";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiUserPlus,
  FiClipboard,
  FiSettings,
  FiLogOut,
  FiBell,
  FiCreditCard,
  FiUser
} from "react-icons/fi";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const HRSidebar = () => {
  const pathname = usePathname();

  // Function to handle user logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="fixed w-64 h-full p-4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-10 overflow-y-auto">
      <div className="flex items-center mb-8 p-2">
        <FiHome className="text-2xl mr-3 text-pink-500" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">HR Portal</h1>
      </div>

      {/* Main Navigation */}
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold mb-3 dark:text-gray-300">Main Navigation</h2>
        <div className="space-y-1">
          <Link href="/users/hr"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname === "/users/hr"
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiHome className="mr-3" />
            <span>Dashboard</span>
          </Link>

          <Link href="/users/hr/user-management"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname.includes("/users/hr/user-management")
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiUsers className="mr-3" />
            <span>User Management</span>
          </Link>

          <Link href="/users/hr/attendance"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname.includes("/users/hr/attendance")
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiCalendar className="mr-3" />
            <span>Attendance</span>
          </Link>

          <Link href="/users/hr/payroll"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname.includes("/users/hr/payroll") && !pathname.includes("/users/hr/my-payroll")
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiDollarSign className="mr-3" />
            <span>Payroll</span>
          </Link>

          <Link href="/users/hr/notifications"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname.includes("/users/hr/notifications")
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiBell className="mr-3" />
            <span>Notifications</span>
          </Link>
        </div>
      </div>

      {/* User Menu */}
      <div className="mb-6">
        <h2 className="text-sm uppercase font-semibold mb-3 dark:text-gray-300">User Menu</h2>

        <div className="space-y-1">          <Link href="/users/hr/my-profile"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname.includes("/users/hr/my-profile")
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiUser className="mr-3" />
            <span>My Profile</span>
          </Link>

          <Link href="/users/hr/my-attendance"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname.includes("/users/hr/my-attendance")
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiUser className="mr-3" />
            <span>My Attendance</span>
          </Link>

          <Link href="/users/hr/my-payroll"
            className={`flex items-center w-full p-3 rounded-lg transition ${pathname.includes("/users/hr/my-payroll")
                ? "bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
            <FiCreditCard className="mr-3" />
            <span>My Payroll</span>
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

export default HRSidebar;