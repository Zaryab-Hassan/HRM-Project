"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";
import { usePathname } from "next/navigation";

const Hrnav = () => {
  const pathname = usePathname();
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };
  
  return (
    <>
      <div className="navbar bg-pink-600 shadow-sm text-white">
        <div className="flex-1">
          <Link href="/users/hr" className="btn btn-ghost text-xl">HRM</Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link 
                href="/users/hr/user-management"
                className={pathname === "/users/hr/user-management" ? "active" : ""}
              >
                User Management
              </Link>
            </li>
            <li>
              <Link 
                href="/users/hr/attendance"
                className={pathname === "/users/hr/attendance" ? "active" : ""}
              >
                Attendance
              </Link>
            </li>
            <li>
              <Link 
                href="/users/hr/payroll"
                className={pathname === "/users/hr/payroll" ? "active" : ""}
              >
                Payroll
              </Link>
            </li>
            <li>
              <a 
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <FiLogOut className="mr-1 inline" /> Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Hrnav;
