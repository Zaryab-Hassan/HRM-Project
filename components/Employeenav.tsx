"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

const Navbar = () => {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };
  return (
    <>
      <div className="navbar bg-pink-600 shadow-sm text-white">
        <div className="flex-1">
          <Link href="/users/employee" className="btn btn-ghost text-xl">HRM</Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
          <li>
              <Link href="/users/employee/profile">Profile</Link>
            </li>
            <li>
              <Link href="/users/employee/attendance">Attendance</Link>
            </li>
            <li>
              <Link href="/users/employee/leave">Leave</Link>
            </li>
            <li>
              <Link href="/users/employee/loan">Loan</Link>
            </li>
            <li>
              <Link href="/users/employee/payroll">Payroll</Link>
            </li>
            <li>
              <Link href="/users/employee/announcements">Announcements</Link>
            </li>            <li>
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

export default Navbar;
