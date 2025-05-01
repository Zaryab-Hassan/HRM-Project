'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiDollarSign, FiClock, FiArrowLeft, FiEdit, FiX, FiSave, FiCheckCircle } from 'react-icons/fi';

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

interface EditableEmployeeData {
  name: string;
  cnic: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  dob: string;
  currentSalary: number;
  shift: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

export default function EmployeeProfile() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editableData, setEditableData] = useState<EditableEmployeeData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

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
          }          
          
          const data = await response.json();
          
          if (data.success && data.data) {
            // The API returns an array, so we need to get the first item
            const employeeData = Array.isArray(data.data) ? data.data[0] : data.data;
            setEmployee(employeeData);
            
            // Initialize editable data
            const emergencyContact = parseEmergencyContact(employeeData.emergencyContact);
            setEditableData({
              name: employeeData.name || '',
              cnic: employeeData.cnic || '',
              department: employeeData.department || '',
              role: employeeData.role || '',
              email: employeeData.email || '',
              phone: employeeData.phone || '',
              dob: employeeData.dob || '',
              currentSalary: employeeData.currentSalary || 0,
              shift: employeeData.shift || '',
              status: employeeData.status || 'Active',
              emergencyContactName: emergencyContact.name !== 'Not provided' ? emergencyContact.name : '',
              emergencyContactPhone: emergencyContact.phone !== 'Not provided' ? emergencyContact.phone : '',
              emergencyContactRelationship: emergencyContact.relationship !== 'Not provided' ? emergencyContact.relationship : ''
            });
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

  // Handle edit profile click
  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  // Handle form field changes
  const handleChange = (field: keyof EditableEmployeeData, value: any) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        [field]: value
      });
    }
  };

  // Handle form submission
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editableData || !employee) return;
    
    try {
      setUpdating(true);
      setUpdateError(null);

      // Create updated employee object
      const updatedEmployee = {
        _id: employee._id,
        name: editableData.name,
        cnic: editableData.cnic,
        department: editableData.department,
        role: editableData.role,
        email: editableData.email,
        phone: editableData.phone,
        dob: editableData.dob,
        currentSalary: editableData.currentSalary,
        shift: editableData.shift,
        status: editableData.status,
        emergencyContact: `${editableData.emergencyContactName},${editableData.emergencyContactPhone},${editableData.emergencyContactRelationship}`
      };

      // Make API call to update employee
      const response = await fetch(`/api/employee/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEmployee)
      });

      const result = await response.json();

      if (result.success) {
        // Update the employee state with the new data
        setEmployee({
          ...employee,
          ...updatedEmployee
        });
        setUpdateSuccess(true);
        
        // Close modal after a short delay to show success message
        setTimeout(() => {
          setShowEditModal(false);
          setUpdateSuccess(false);
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to update employee profile');
      }
    } catch (err) {
      console.error('Error updating employee profile:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update employee profile');
    } finally {
      setUpdating(false);
    }
  };

  // Format date for input field
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white relative">
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
            
            {/* Edit Profile Button */}
            <button 
              onClick={handleEditProfile}
              className="absolute top-6 right-6 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded flex items-center"
            >
              <FiEdit className="mr-2" /> Edit Profile
            </button>
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

      {/* Edit Profile Modal */}
      {showEditModal && editableData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Employee Profile</h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitUpdate} className="p-6">
              {updateSuccess && (
                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded flex items-center">
                  <FiCheckCircle className="mr-2" /> Profile updated successfully!
                </div>
              )}
              
              {updateError && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
                  {updateError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Personal Information</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editableData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CNIC
                    </label>
                    <input
                      type="text"
                      value={editableData.cnic}
                      onChange={(e) => handleChange('cnic', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department
                    </label>
                    <select
                      value={editableData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="IT">IT</option>
                      <option value="Operations">Operations</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Customer Support">Customer Support</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editableData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editableData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(editableData.dob)}
                      onChange={(e) => handleChange('dob', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                {/* Professional Information & Emergency Contact */}
                <div>
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Professional Information</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={editableData.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Salary
                    </label>
                    <input
                      type="number"
                      value={editableData.currentSalary}
                      onChange={(e) => handleChange('currentSalary', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Shift
                    </label>
                    <select
                      value={editableData.shift}
                      onChange={(e) => handleChange('shift', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select Shift</option>
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                      <option value="Flexible">Flexible</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editableData.status}
                      onChange={(e) => handleChange('status', e.target.value as 'Active' | 'On Leave' | 'Terminated')}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                  
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mt-6 mb-4">Emergency Contact</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editableData.emergencyContactName}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={editableData.emergencyContactPhone}
                      onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={editableData.emergencyContactRelationship}
                      onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-4 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-opacity-50 rounded-full"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
