'use client';

import { FiClock } from 'react-icons/fi';

type AttendanceRecord = {
  _id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'leave';
  hoursWorked?: number;
  autoClockOut: boolean;
  notes?: string;
};

type Employee = {
  _id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  attendance?: AttendanceRecord[];
  clockedInToday?: boolean;
};

interface TodaysAttendanceProps {
  employees: Employee[];
  loading: boolean;
}

export default function TodaysAttendance({ employees, loading }: TodaysAttendanceProps) {
  // Filter out terminated employees
  const activeEmployees = employees.filter(employee => employee.status !== 'Terminated');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8">
      <div className="p-6 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiClock className="dark:text-gray-300" /> Today's Attendance
        </h2>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            ))}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {activeEmployees.map((employee) => (
                <tr
                  key={employee._id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${employee.clockedInToday ? 'bg-green-50 dark:bg-green-900/20' : ''
                    }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap dark:text-white">{employee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{employee.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{employee.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.clockedInToday ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                        Clocked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 mr-1 bg-gray-400 rounded-full"></span>
                        Not Clocked In
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && activeEmployees.length === 0 && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">No employees found</div>
      )}
    </div>
  );
}