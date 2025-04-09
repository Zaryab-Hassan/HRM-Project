// app/attendance-manager/page.tsx
'use client';

import { useState } from 'react';
import { FiCalendar, FiCheckCircle, FiXCircle, FiBarChart2 } from 'react-icons/fi';

type LeaveRequest = {
  id: number;
  employeeName: string;
  type: 'Vacation' | 'Sick' | 'Personal';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

type AttendanceData = {
  date: string;
  present: number;
  absent: number;
  onLeave: number;
};

export default function AttendanceManager() {
  // Sample leave requests data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: 1, employeeName: 'John Doe', type: 'Vacation', startDate: '2023-06-15', endDate: '2023-06-18', status: 'Pending' },
    { id: 2, employeeName: 'Jane Smith', type: 'Sick', startDate: '2023-06-16', endDate: '2023-06-16', status: 'Pending' },
  ]);

  // Sample attendance data for charts
  const attendanceData: AttendanceData[] = [
    { date: 'Jun 1', present: 85, absent: 17, onLeave: 10 },
    { date: 'Jun 2', present: 82, absent: 8, onLeave: 10 },
    { date: 'Jun 3', present: 88, absent: 2, onLeave: 10 },
    { date: 'Jun 4', present: 90, absent: 0, onLeave: 10 },
    { date: 'Jun 5', present: 87, absent: 3, onLeave: 10 },
  ];

  const handleApproveLeave = (id: number) => {
    setLeaveRequests(leaveRequests.map(request =>
      request.id === id ? { ...request, status: 'Approved' } : request
    ));
  };

  const handleRejectLeave = (id: number) => {
    setLeaveRequests(leaveRequests.map(request =>
      request.id === id ? { ...request, status: 'Rejected' } : request
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Attendance Manager</h1>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Daily Attendance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiCalendar /> Today&apos;s Attendance
          </h2>
          <div className="space-y-2">
            <p>Present: <span className="font-bold">92</span></p>
            <p>Absent: <span className="font-bold">3</span></p>
            <p>On Leave: <span className="font-bold">5</span></p>
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiBarChart2 /> Monthly Overview
          </h2>
          <div className="space-y-2">
            <p>Average Attendance: <span className="font-bold">89%</span></p>
            <p>Total Leaves: <span className="font-bold">24</span></p>
            <p>Absenteeism Rate: <span className="font-bold">4.2%</span></p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              Generate Daily Report
            </button>
            <button className="w-full py-2 px-4 bg-green-100 text-green-700 rounded hover:bg-green-200">
              Export Monthly Data
            </button>
          </div>
        </div>
      </div>

      {/* Leave Approval Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FiCalendar /> Pending Leave Requests
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests
                .filter(request => request.status === 'Pending')
                .map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{request.employeeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{request.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        onClick={() => handleApproveLeave(request.id)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800"
                      >
                        <FiCheckCircle /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(request.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <FiXCircle /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {leaveRequests.filter(request => request.status === 'Pending').length === 0 && (
          <div className="p-6 text-center text-gray-500">No pending leave requests</div>
        )}
      </div>

      {/* Attendance Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FiBarChart2 /> Attendance Trends (Last 5 Days)
        </h2>
        <div className="h-64">
          {/* In a real app, you would use a charting library like Chart.js or Recharts */}
          <div className="flex items-end h-48 gap-2 mt-4">
            {attendanceData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex items-end w-full h-40">
                  <div 
                    className="w-full bg-green-500" 
                    style={{ height: `${(day.present / 100) * 100}%` }}
                    title={`Present: ${day.present}`}
                  ></div>
                  <div 
                    className="w-full bg-red-500" 
                    style={{ height: `${(day.absent / 100) * 100}%` }}
                    title={`Absent: ${day.absent}`}
                  ></div>
                  <div 
                    className="w-full bg-yellow-500" 
                    style={{ height: `${(day.onLeave / 100) * 100}%` }}
                    title={`On Leave: ${day.onLeave}`}
                  ></div>
                </div>
                <div className="text-xs mt-2">{day.date}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500"></div>
              <span>On Leave</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}