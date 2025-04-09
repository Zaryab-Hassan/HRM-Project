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
// Types for our data
type Employee = {
  id: number;
  name: string;
  position: string;
  department: string;
  attendance: string;
  leaves: number;
  salary: number;
  loanStatus: string;
};

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
    <div className="flex bg-gray-50 min-h-screen overflow-hidden">
      {/* Sidebar with Quick Actions */}
      <div className="fixed w-64 h-full p-4 shadow-lg z-10">
        <div className=" flex items-center mb-8 p-2">
          <FiHome className="text-2xl mr-3 text-pink-500" />
          <h1 className="text-xl font-bold ">Manager Dashboard</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-sm uppercase font-semibold mb-4 ">Quick Actions</h2>
          <div className="space-y-2">
            <button className="flex items-center w-full p-3 rounded-lg  bg-opacity-10 hover:bg-opacity-20 transition">
              <FiCheck className="mr-3 text-pink-500" />
              Approve Leaves
            </button>
            <button className="flex items-center w-full p-3 rounded-lg  bg-opacity-10 hover:bg-opacity-20 transition">
              <FiMail className="mr-3 text-pink-500" />
              Post Announcement
            </button>
            <button className="flex items-center w-full p-3 rounded-lg  bg-opacity-10 hover:bg-opacity-20 transition">
              <FiUserPlus className="mr-3 text-pink-500" />
              Add Employee
            </button>
            <button className="flex items-center w-full p-3 rounded-lg  bg-opacity-10 hover:bg-opacity-20 transition">
              <FiDollarSign className="mr-3 text-pink-500" />
              Generate Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1  p-8 ml-64 ">
        {/* Summary Cards */}
        <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Total Employees</h3>
                <p className="text-2xl font-bold mt-1">{summaryStats?.totalEmployees}</p>
              </div>
              <div className="p-3 rounded-lg bg-pink-50 text-pink-600">
                <FiUsers className="text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Present Today</h3>
                <p className="text-2xl font-bold mt-1">{summaryStats?.presentToday}</p>
                <p className="text-green-500 text-sm mt-1">
                  {summaryStats && ((summaryStats.presentToday / summaryStats.totalEmployees) * 100).toFixed(1)}% attendance
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <FiCheck className="text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Pending Leaves</h3>
                <p className="text-2xl font-bold mt-1">{summaryStats?.pendingLeaves}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <FiCalendar className="text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm font-medium">Monthly Payroll</h3>
                <p className="text-2xl font-bold mt-1">
                  ${summaryStats?.totalPayroll.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <FiDollarSign className="text-xl" />
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Leave Requests Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold flex items-center">
              <FiCalendar className="mr-2 text-pink-600" />
              Pending Leave Requests
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveRequests.filter(req => req.status === "Pending").map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                          {request.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproveLeave(request.id)}
                        className="mr-3 text-green-600 hover:text-green-900 flex items-center"
                      >
                        <FiCheck className="mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(request.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold flex items-center">
              <FiBell className="mr-2 text-pink-600" />
              Notifications
            </h2>
          </div>
          <div className="p-6">
            {/* Birthdays */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <span className="h-2 w-2 bg-pink-500 rounded-full mr-2"></span>
                Birthdays Today
              </h3>
              {summaryStats?.birthdaysToday.length ? (
                <ul className="space-y-3">
                  {summaryStats.birthdaysToday.map(name => (
                    <li key={name} className="flex items-center p-3 bg-pink-50 rounded-lg">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                        {name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-sm text-pink-600">Birthday Today!</p>
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
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
                Pending Approvals
              </h3>
              {leaveRequests.filter(req => req.status === "Pending").length ? (
                <ul className="space-y-3">
                  {leaveRequests.filter(req => req.status === "Pending").map(request => (
                    <li key={request.id} className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            {request.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{request.name}</p>
                            <p className="text-sm text-yellow-600">{request.reason}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{request.date}</span>
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

  // return (
  //   <div className="min-h-screen bg-gray-100 p-6">
  //     <header className="mb-8">
  //       <h1 className="text-3xl font-bold text-pink-600">Manager Dashboard</h1>
  //     </header>

  //     <div className="flex gap-6">
  //       {/* Main Content */}
  //       <div className="flex-1">
  //         {/* Summary Widgets */}
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  //           <div className="bg-white p-6 rounded-lg shadow">
  //             <h3 className="text-gray-500 text-sm font-medium">Total Employees</h3>
  //             <p className="text-2xl font-bold">{summaryStats?.totalEmployees}</p>
  //           </div>
  //           <div className="bg-white p-6 rounded-lg shadow">
  //             <h3 className="text-gray-500 text-sm font-medium">Present Today</h3>
  //             <p className="text-2xl font-bold">{summaryStats?.presentToday}</p>
  //             <p className="text-green-500 text-sm mt-1">
  //               {summaryStats && ((summaryStats.presentToday / summaryStats.totalEmployees) * 100).toFixed(1)}% attendance
  //             </p>
  //           </div>
  //           <div className="bg-white p-6 rounded-lg shadow">
  //             <h3 className="text-gray-500 text-sm font-medium">Pending Leaves</h3>
  //             <p className="text-2xl font-bold">{summaryStats?.pendingLeaves}</p>
  //           </div>
  //           <div className="bg-white p-6 rounded-lg shadow">
  //             <h3 className="text-gray-500 text-sm font-medium">Monthly Payroll</h3>
  //             <p className="text-2xl font-bold">
  //               ${summaryStats?.totalPayroll.toLocaleString()}
  //             </p>
  //           </div>
  //         </div>

  //         {/* Quick Action Buttons */}
  //         <div className="bg-white p-6 rounded-lg shadow mb-8">
  //           <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
  //           <div className="flex flex-wrap gap-4">
  //             <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  //               Approve Leaves
  //             </button>
  //             <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
  //               Post Announcement
  //             </button>
  //             <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">
  //               Add New Employee
  //             </button>
  //             <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
  //               Generate Payroll
  //             </button>
  //           </div>
  //         </div>

  //         {/* Leave Requests */}
  //         <div className="bg-white p-6 rounded-lg shadow mb-8">
  //           <h2 className="text-xl font-semibold mb-4">Pending Leave Requests</h2>
  //           <div className="overflow-x-auto">
  //             <table className="min-w-full divide-y divide-gray-200">
  //               <thead className="bg-gray-50">
  //                 <tr>
  //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
  //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
  //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
  //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
  //                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
  //                 </tr>
  //               </thead>
  //               <tbody className="bg-white divide-y divide-gray-200">
  //                 {leaveRequests.filter(req => req.status === "Pending").map((request) => (
  //                   <tr key={request.id}>
  //                     <td className="px-6 py-4 whitespace-nowrap">{request.name}</td>
  //                     <td className="px-6 py-4 whitespace-nowrap">{request.date}</td>
  //                     <td className="px-6 py-4 whitespace-nowrap">{request.reason}</td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
  //                         {request.status}
  //                       </span>
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       <button 
  //                         onClick={() => handleApproveLeave(request.id)}
  //                         className="mr-2 text-green-600 hover:text-green-900"
  //                       >
  //                         Approve
  //                       </button>
  //                       <button 
  //                         onClick={() => handleRejectLeave(request.id)}
  //                         className="text-red-600 hover:text-red-900"
  //                       >
  //                         Reject
  //                       </button>
  //                     </td>
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </table>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Notifications Panel */}
  //       <div className="w-80">
  //         <div className="bg-white p-6 rounded-lg shadow sticky top-6">
  //           <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            
  //           {/* Birthdays */}
  //           <div className="mb-6">
  //             <h3 className="text-sm font-medium text-gray-500 mb-2">Birthdays Today</h3>
  //             {summaryStats?.birthdaysToday.length ? (
  //               <ul className="space-y-2">
  //                 {summaryStats.birthdaysToday.map(name => (
  //                   <li key={name} className="flex items-center">
  //                     <span className="h-2 w-2 bg-pink-500 rounded-full mr-2"></span>
  //                     <span>{name}</span>
  //                   </li>
  //                 ))}
  //               </ul>
  //             ) : (
  //               <p className="text-gray-400 text-sm">No birthdays today</p>
  //             )}
  //           </div>

  //           {/* Pending Leaves */}
  //           <div>
  //             <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Approvals</h3>
  //             {leaveRequests.filter(req => req.status === "Pending").length ? (
  //               <ul className="space-y-2">
  //                 {leaveRequests.filter(req => req.status === "Pending").map(request => (
  //                   <li key={request.id} className="flex justify-between items-center">
  //                     <div>
  //                       <span className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></span>
  //                       <span>{request.name} - {request.reason}</span>
  //                     </div>
  //                     <span className="text-xs text-gray-500">{request.date}</span>
  //                   </li>
  //                 ))}
  //               </ul>
  //             ) : (
  //               <p className="text-gray-400 text-sm">No pending approvals</p>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}


// /"use client";
// import { useState, useEffect } from "react";


// export default function manager() {
//     const [users, setUsers] = useState([]);

//     useEffect(() => {
//         async function fetchData() {
//         const data = await fetch("/dummyData.json");
//         setUsers(await data.json());
//         }
//         fetchData();
//     }, []);

//     console.log(users);

//     return (
//       <div >
//         <div className="bg-[url('https://images.pexels.com/photos/853168/pexels-photo-853168.jpeg')] bg-cover bg-center bg-no-repeat min-h-screen w-full">
            
//         </div>
//       </div>
//     );
// }