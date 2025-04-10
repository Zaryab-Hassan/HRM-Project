"use client";
import Link from "next/link";

const Navbar = () => {
  return (
    <>
      <div className="navbar bg-pink-600 shadow-sm text-white">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">HRM</a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="/users/hr/user">User Management</Link>
            </li>
            <li>
              <Link href="/users/hr/attendance">Attendance</Link>
            </li>
            <li>
              <Link href="/users/hr/payroll">Payroll</Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Navbar;

// "use client";
// import Link from "next/link";

// const Navbar = () => {
//   return (
//     <nav className="bg-white shadow-md p-4 font-sans">
//       <div className="container mx-auto flex justify-between items-center">
//         {/* Logo */}
//         <Link href="/" className="text-pink-600 text-2xl font-bold tracking-wide hover:underline">
//           HRM System
//         </Link>

//         {/* Desktop Menu */}
//         <div className="hidden md:flex items-center space-x-6">
//           <ul className="flex space-x-6">
//             <li>
//               <Link href="/" className="text-gray-800 hover:text-[#D42B77] transition duration-300 ease-in-out">
//                 Home
//               </Link>
//             </li>
//             <li>
//               <Link href="/about" className="text-gray-800 hover:text-[#D42B77] transition duration-300 ease-in-out">
//                 About
//               </Link>
//             </li>
//             <li>
//               <Link href="/contact" className="text-gray-800 hover:text-[#D42B77] transition duration-300 ease-in-out">
//                 Contact
//               </Link>
//             </li>
//           </ul>

//           {/* Login Button */}
//           <Link href="/">
//             <button className="bg-pink-600 text-white px-4 py-2 rounded-full font-medium hover:text-pink-600 hover:bg-white transition duration-300 ease-in-out">
//               Login
//             </button>
//           </Link>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
