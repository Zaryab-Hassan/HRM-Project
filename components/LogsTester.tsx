'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * A component to help test the activity logs functionality
 * This should only be visible to managers/HR for debugging purposes
 */
export default function LogsTester() {
  const { data: session } = useSession();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('view');
  const [module, setModule] = useState('logs');
  const [details, setDetails] = useState('Test activity log entry');

  // Only allow managers or hr to use this tool
  if (!session?.user || (session.user.role !== 'manager' && session.user.role !== 'hr')) {
    return null;
  }

  const createTestLog = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          module,
          details,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`Success! Log created with ID: ${data.data._id}`);
      } else {
        setResult(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="font-medium mb-4 text-lg">Activity Logs Tester</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Action:</label>
          <select 
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="view">View</option>
            <option value="download">Download</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Module:</label>
          <select 
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            <option value="profile">Profile</option>
            <option value="attendance">Attendance</option>
            <option value="payroll">Payroll</option>
            <option value="leave">Leave</option>
            <option value="employee">Employee</option>
            <option value="settings">Settings</option>
            <option value="logs">Logs</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Details:</label>
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          />
        </div>
        
        <button
          onClick={createTestLog}
          disabled={loading}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Log'}
        </button>
        
        {result && (
          <div className={`mt-4 p-3 rounded ${result.startsWith('Success') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
