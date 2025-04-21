'use client';

import { useState } from 'react';
import { FiUser } from 'react-icons/fi';

type Employee = {
  _id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  attendance?: any[];
  clockedInToday?: boolean;
};

interface EmployeeStatusProps {
  employees: Employee[];
  loading: boolean;
  onTerminateEmployee: (employeeId: string) => Promise<void>;
}

export default function EmployeeStatus({ 
  employees, 
  loading, 
  onTerminateEmployee
}: EmployeeStatusProps) {
  const [terminatingEmployee, setTerminatingEmployee] = useState<string | null>(null);

  const handleTerminate = async (employeeId: string) => {
    try {
      setTerminatingEmployee(employeeId);
      await onTerminateEmployee(employeeId);
    } finally {
      setTerminatingEmployee(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 mb-8">
      <div className="p-6 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiUser className="dark:text-gray-300" /> Employee Status
        </h2>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {employees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap dark:text-white">{employee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{employee.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">{employee.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'Active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : employee.status === 'On Leave'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTerminate(employee._id)}
                      disabled={employee.status === 'Terminated' || terminatingEmployee === employee._id}
                      className={`px-3 py-1 text-xs font-medium rounded-lg ${
                        employee.status === 'Terminated' || terminatingEmployee === employee._id
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                          : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700'
                      }`}
                    >
                      {terminatingEmployee === employee._id ? 'Processing...' : 'Terminate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && employees.length === 0 && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">No employees found</div>
      )}
    </div>
  );
}