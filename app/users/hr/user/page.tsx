'use client';
import { useState } from 'react';
import { FiMail } from 'react-icons/fi';

export default function UserManagement() {
  const [additionalLeaves, setAdditionalLeaves] = useState<{[key: number]: number}>({});

  // Sample data
  const employees = [
    { id: 1, name: 'John Doe', department: 'HR', leaves: 14 },
    { id: 2, name: 'Jane Smith', department: 'Finance', leaves: 12 }
  ];

  const handleAssignLeaves = (id: number, value: string) => {
    setAdditionalLeaves(prev => ({
      ...prev,
      [id]: parseInt(value) || 0
    }));
  };

  return (
    <div className='dark:bg-gray-900 p-6'>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">User Management</h1>
      
      {/* Terminate User Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Terminate User</h2>
        {/* Implementation would go here */}
      </div>

      {/* Leaves Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Leaves Management</h2>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Current Leaves</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Additional Leaves</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Leaves</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 dark:text-white">{emp.name}</td>
                <td className="px-6 py-4 dark:text-white">{emp.leaves}</td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={additionalLeaves[emp.id] || ''}
                    onChange={(e) => handleAssignLeaves(emp.id, e.target.value)}
                    className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </td>
                <td className="px-6 py-4 dark:text-white">
                  {emp.leaves + (additionalLeaves[emp.id] || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email Password Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Manage Email Passwords</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <FiMail /> Reset All Passwords
        </button>
      </div>
    </div>
  );
}