'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiMail, FiSearch, FiUser, FiSave, FiKey } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Employee {
  _id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  cnic: string;
  status: string;
  totalLeaves?: number; // Using totalLeaves for tracking leave allocation
}

// Define interface for leave update result from API
interface LeaveUpdateResult {
  success: boolean;
  employeeId: string;
  message: string;
  newLeaveCount?: number;
}

export default function UserManagement() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [additionalLeaves, setAdditionalLeaves] = useState<{[key: string]: number}>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingLeaves, setUpdatingLeaves] = useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = useState<{type: string, text: string} | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [resettingPasswords, setResettingPasswords] = useState<boolean>(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState<{type: string, text: string} | null>(null);
  
  // Pagination state
  const [directoryDisplayLimit, setDirectoryDisplayLimit] = useState<number>(5);
  const [leavesDisplayLimit, setLeavesDisplayLimit] = useState<number>(5);
  
  // New state for password reset modal
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Add clientSide flag to prevent hydration mismatch
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    // Mark component as client-side rendered
    setIsClient(true);
    
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/hr/employees');
        const result = await response.json();
        
        if (result.success) {
          setEmployees(result.data);
        } else {
          setError('Failed to fetch employees');
        }
      } catch (err) {
        setError('An error occurred while fetching employee data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Filter employees based on search term - using useMemo to prevent recalculation on every render
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cnic?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Handle checkbox selection for password reset
  const handleEmployeeSelection = (id: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(id)) {
        return prev.filter(empId => empId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Update selection when filtered results change
  useEffect(() => {
    if (isClient) { // Only run this effect on the client-side
      // Keep only the employees that are still in filteredEmployees
      const updatedSelection = selectedEmployees.filter(id => 
        filteredEmployees.some(emp => emp._id === id)
      );
      
      // Only update if there's an actual change to avoid infinite loops
      if (JSON.stringify(updatedSelection) !== JSON.stringify(selectedEmployees)) {
        setSelectedEmployees(updatedSelection);
      }
    }
  }, [isClient, filteredEmployees]); // Remove selectedEmployees from dependencies

  const handleAssignLeaves = (id: string, value: string) => {
    setAdditionalLeaves(prev => ({
      ...prev,
      [id]: parseInt(value) || 0
    }));
  };
  
  const saveLeaveChanges = async () => {
    try {
      setUpdatingLeaves(true);
      setUpdateMessage(null);
      
      // Filter out employees that have additional leaves assigned
      const updatedEmployees = Object.keys(additionalLeaves)
        .filter(id => additionalLeaves[id] !== 0)
        .map(id => ({
          employeeId: id,
          additionalLeaves: additionalLeaves[id]
        }));
      
      if (updatedEmployees.length === 0) {
        setUpdateMessage({
          type: 'warning',
          text: 'No changes to save.'
        });
        setUpdatingLeaves(false);
        return;
      }
      
      const response = await fetch('/api/hr/employees/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates: updatedEmployees })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the local employee data with new leave counts
        const updatedEmployeesList = employees.map(emp => {
          const updateResult = result.results?.find((r: LeaveUpdateResult) => r.employeeId === emp._id);
          if (updateResult?.success) {
            return {
              ...emp,
              totalLeaves: updateResult.newLeaveCount
            };
          }
          return emp;
        });
        
        setEmployees(updatedEmployeesList);
        setAdditionalLeaves({});
        setUpdateMessage({
          type: 'success',
          text: 'Leave allocations updated successfully!'
        });
      } else {
        setUpdateMessage({
          type: 'error',
          text: result.message || 'Failed to update leave allocations.'
        });
      }
    } catch (err) {
      setUpdateMessage({
        type: 'error',
        text: 'An error occurred while updating leave allocations.'
      });
      console.error(err);
    } finally {
      setUpdatingLeaves(false);
    }
  };

  // Open password reset modal
  const openPasswordResetModal = () => {
    if (selectedEmployees.length === 0) {
      setPasswordResetMessage({
        type: 'warning',
        text: 'No employees selected for password reset.'
      });
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  // Close password reset modal
  const closePasswordResetModal = () => {
    setShowPasswordModal(false);
  };

  // Handle password reset functionality
  const handleResetPasswords = async () => {
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setPasswordError('Both fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    try {
      setResettingPasswords(true);
      setPasswordResetMessage(null);
      setPasswordError(null);

      const response = await fetch('/api/hr/employees/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          employeeIds: selectedEmployees,
          newPassword: newPassword
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPasswordResetMessage({
          type: 'success',
          text: `Successfully reset passwords for ${result.results.filter((r: any) => r.success).length} employees.`
        });
        // Clear selection after successful reset
        setSelectedEmployees([]);
        setSelectAll(false);
        setShowPasswordModal(false);
      } else {
        setPasswordResetMessage({
          type: 'error',
          text: result.error || 'Failed to reset passwords.'
        });
      }
    } catch (err) {
      setPasswordResetMessage({
        type: 'error',
        text: 'An error occurred while resetting passwords.'
      });
      console.error(err);
    } finally {
      setResettingPasswords(false);
    }
  };
  
  // Navigate to employee detail page
  const handleViewEmployeeDetails = (id: string) => {
    router.push(`/users/hr/user-management/${id}`);
  };
  
  return (
    <div className='dark:bg-gray-900 p-6'>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">User Management</h1>
      
      {/* Employee List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Employee Directory</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    {/* Checkbox column remains, but without the Select All checkbox */}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CNIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {!isClient ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center dark:text-white">
                      Loading...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center dark:text-white">
                      {searchTerm ? "No employees found matching your search." : "No employees found in the database."}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.slice(0, directoryDisplayLimit).map(emp => (
                    <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp._id)}
                          onChange={() => handleEmployeeSelection(emp._id)}
                          className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                        />
                      </td>
                      <td className="px-6 py-4 dark:text-white">{emp.name}</td>
                      <td className="px-6 py-4 dark:text-white">{emp.cnic}</td>
                      <td className="px-6 py-4 dark:text-white">{emp.department}</td>
                      <td className="px-6 py-4 dark:text-white">{emp.role}</td>
                      <td className="px-6 py-4 dark:text-white">{emp.email}</td>
                      <td className="px-6 py-4 dark:text-white">{emp.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                          ${emp.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                            emp.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                          onClick={() => handleViewEmployeeDetails(emp._id)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {isClient && filteredEmployees.length > directoryDisplayLimit && (
              <div className="flex justify-end mt-4">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setDirectoryDisplayLimit(prev => prev + 5)}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
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
            {loading || !isClient ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center dark:text-white">
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.slice(0, leavesDisplayLimit).map(emp => (
                <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 dark:text-white">{emp.name}</td>
                  <td className="px-6 py-4 dark:text-white">{emp.totalLeaves || 14}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={additionalLeaves[emp._id] || ''}
                      onChange={(e) => handleAssignLeaves(emp._id, e.target.value)}
                      className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="px-6 py-4 dark:text-white">
                    {(emp.totalLeaves || 14) + (additionalLeaves[emp._id] || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {isClient && filteredEmployees.length > leavesDisplayLimit && (
          <div className="flex justify-end mt-4">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setLeavesDisplayLimit(prev => prev + 5)}
            >
              Load More
            </button>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={saveLeaveChanges}
            disabled={updatingLeaves}
          >
            <FiSave /> {updatingLeaves ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        {updateMessage && (
          <div className={`mt-4 p-4 rounded ${updateMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : updateMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
            {updateMessage.text}
          </div>
        )}
      </div>

      {/* Email Password Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Manage Email Passwords</h2>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={openPasswordResetModal}
          disabled={resettingPasswords}
        >
          <FiKey /> Reset Passwords
        </button>
        {passwordResetMessage && (
          <div className={`mt-4 p-4 rounded ${passwordResetMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : passwordResetMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
            {passwordResetMessage.text}
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Reset Passwords</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Enter a new password for {selectedEmployees.length} selected employee{selectedEmployees.length > 1 ? 's' : ''}.
            </p>
            
            {passwordError && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {passwordError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter new password"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={closePasswordResetModal}
                disabled={resettingPasswords}
              >
                Cancel
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleResetPasswords}
                disabled={resettingPasswords}
              >
                {resettingPasswords ? 'Resetting...' : 'Reset Passwords'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}