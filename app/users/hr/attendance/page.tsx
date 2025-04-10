'use client';
import { useState } from 'react';
import { FiClock, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState('tracking');

  // Sample data
  const attendanceRecords = [
    { id: 1, name: 'John Doe', date: '2023-06-01', clockIn: '09:00', clockOut: '17:00', status: 'Present' },
    { id: 2, name: 'Jane Smith', date: '2023-06-01', clockIn: '09:15', clockOut: '17:30', status: 'Late' }
  ];

  return (
    <div className='dark:bg-gray-900 p-6'>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Attendance Management</h1>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`px-4 py-2 ${activeTab === 'tracking' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}`}
        >
          <FiClock className="inline mr-2" /> In-Out Tracking
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 ${activeTab === 'records' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}`}
        >
          <FiTrendingUp className="inline mr-2" /> Attendance Records
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={`px-4 py-2 ${activeTab === 'violations' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}`}
        >
          <FiAlertCircle className="inline mr-2" /> Late/Early Departures
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
        {activeTab === 'tracking' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Clock In/Out Time</h2>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Clock In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Clock Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {attendanceRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 dark:text-white">{record.name}</td>
                    <td className="px-6 py-4 dark:text-gray-300">{record.date}</td>
                    <td className="px-6 py-4 dark:text-gray-300">{record.clockIn}</td>
                    <td className="px-6 py-4 dark:text-gray-300">{record.clockOut}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.status === 'Present' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                        'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'records' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Attendance Records</h2>
            {/* Records implementation */}
          </div>
        )}

        {activeTab === 'violations' && (
          <div>
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Late Arrivals/Early Departures</h2>
            {/* Violations implementation */}
          </div>
        )}
      </div>
    </div>
  );
}