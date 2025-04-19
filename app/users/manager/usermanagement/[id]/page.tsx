'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiDollarSign, FiClock, FiArrowLeft } from 'react-icons/fi';

// Define the Employee type
interface Employee {
  _id: string;
  name: string;
  cnic: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  emergencyContact: string;
  dob: string;
  initialSalary: number;
  currentSalary: number;
  shift: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  formattedDob?: string;
  formattedJoiningDate?: string;
  serviceDuration?: string;
  joiningDate?: string;
  managerId?: string;
}

export default function EmployeeProfile() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Fetch employee data when session is authenticated
    if (status === 'authenticated' && params.id) {
      const fetchEmployeeData = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`/api/employee/profile/all?id=${params.id}`, {
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (!response.ok) {
            if (response.status === 401) {
              router.push('/?error=Session expired. Please login again.');
              return;
            }
            throw new Error('Failed to fetch employee data');
          }          const data = await response.json();
          
          if (data.success && data.data) {
            // The API returns an array, so we need to get the first item
            setEmployee(Array.isArray(data.data) ? data.data[0] : data.data);
          } else {
            throw new Error(data.error || 'Employee not found');
          }
        } catch (err) {
          console.error('Error fetching employee profile:', err);
          setError(err instanceof Error ? err.message : 'An error occurred while fetching employee data');
        } finally {
          setLoading(false);
        }
      };

      fetchEmployeeData();
    }
  }, [status, params.id, router]);

  // Parse emergency contact information
  const parseEmergencyContact = (contact: string | undefined) => {
    if (!contact) return { name: 'Not provided', phone: 'Not provided', relationship: 'Not provided' };
    
    const parts = contact.split(',');
    return {
      name: parts[0] || 'Not provided',
      phone: parts[1] || 'Not provided',
      relationship: parts[2] || 'Not provided'
    };
  };

  const emergencyContact = employee ? parseEmergencyContact(employee.emergencyContact) : { name: '', phone: '', relationship: '' };

  // Handle going back to user management page
  const handleBack = () => {
    router.push('/users/manager/usermanagement');
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-7xl mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading employee profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-7xl mx-auto">
          <button 
            onClick={handleBack} 
            className="mb-6 flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiArrowLeft className="mr-2" /> Back to User Management
          </button>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-7xl mx-auto">
          <button 
            onClick={handleBack} 
            className="mb-6 flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiArrowLeft className="mr-2" /> Back to User Management
          </button>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Notice:</strong>
            <span className="block sm:inline"> Employee data not available.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 pt-6">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
        <button 
          onClick={handleBack} 
          className="mb-6 flex items-center text-blue-600 dark:text-blue-400 hover:underline"
        >
          <FiArrowLeft className="mr-2" /> Back to User Management
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                <FiUser className="text-3xl text-blue-500 dark:text-blue-400" />
              </div>
              <div className="ml-6">
                <h2 className="text-xl font-bold">{employee.name}</h2>
                <p className="text-blue-100">{employee.department} Department</p>
                <p className="text-blue-100">{employee.role}</p>
                {employee.status && (
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium 
                    ${employee.status === 'Active' ? 'bg-green-500' : 
                      employee.status === 'On Leave' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {employee.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
                  <p className="p-2 text-gray-800 dark:text-white">{employee.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CNIC</label>
                  <p className="p-2 text-gray-800 dark:text-white">{employee.cnic}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Department</label>
                  <p className="p-2 text-gray-800 dark:text-white">{employee.department}</p>
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <FiMail className="mr-2" /> Email
                  </label>
                  <p className="p-2 text-gray-800 dark:text-white">{employee.email}</p>
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <FiPhone className="mr-2" /> Phone
                  </label>
                  <p className="p-2 text-gray-800 dark:text-white">{employee.phone || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <FiCalendar className="mr-2" /> Date of Birth
                  </label>
                  <p className="p-2 text-gray-800 dark:text-white">
                    {employee.formattedDob || new Date(employee.dob).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Professional Information & Emergency Contact */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Professional Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
                    <p className="p-2 text-gray-800 dark:text-white">{employee.role}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <FiDollarSign className="mr-2 inline" /> Current Salary
                    </label>
                    <p className="p-2 text-gray-800 dark:text-white">${employee.currentSalary.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      <FiClock className="mr-2 inline" /> Shift
                    </label>
                    <p className="p-2 text-gray-800 dark:text-white">{employee.shift}</p>
                  </div>
                  
                  {employee.joiningDate && (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        <FiCalendar className="mr-2 inline" /> Joining Date
                      </label>
                      <p className="p-2 text-gray-800 dark:text-white">
                        {employee.formattedJoiningDate || new Date(employee.joiningDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {employee.serviceDuration && (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Service Duration</label>
                      <p className="p-2 text-gray-800 dark:text-white">{employee.serviceDuration}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white">
                    Emergency Contact
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
                    <p className="p-2 text-gray-800 dark:text-white">{emergencyContact.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contact Number</label>
                    <p className="p-2 text-gray-800 dark:text-white">{emergencyContact.phone}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Relationship</label>
                    <p className="p-2 text-gray-800 dark:text-white">{emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
