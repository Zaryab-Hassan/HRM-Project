import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiAlertTriangle } from 'react-icons/fi';

export interface EmployeeProfile {
  _id: string;
  name: string;
  cnic: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  dob?: string;
  initialSalary?: number;
  currentSalary?: number;
  shift?: string;
  status?: string;
  managerId?: string;
}

interface UserProfileProps {
  profileData: EmployeeProfile | null;
  loading: boolean;
  error: string | null;
  isEditing: boolean;
  editData: {
    phone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    profilePicture: File | null;
  };
  onToggleEdit: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function UserProfile({
  profileData,
  loading,
  error,
  isEditing,
  editData,
  onToggleEdit,
  onInputChange,
  onFileChange,
  onSubmit
}: UserProfileProps) {
  if (loading) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Notice:</strong>
          <span className="block sm:inline"> Profile data not available.</span>
        </div>
      </div>
    );
  }
  // Parse emergency contact information with safety checks
  let emergencyName = 'Not provided';
  let emergencyPhone = 'Not provided';
  let emergencyRelationship = 'Not provided';
  
  if (profileData.emergencyContact) {
    const emergencyContactInfo = profileData.emergencyContact.split(',');
    emergencyName = emergencyContactInfo[0] || 'Not provided';
    emergencyPhone = emergencyContactInfo[1] || 'Not provided';
    emergencyRelationship = emergencyContactInfo[2] || 'Not provided';
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Profile</h1>
          <button
            onClick={onToggleEdit}
            className={`px-4 py-2 rounded-md ${
              isEditing ? "bg-gray-500 hover:bg-gray-600" : "bg-blue-500 hover:bg-blue-600"
            } text-white transition-colors`}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {isEditing ? (
                  <label className="cursor-pointer w-full h-full flex items-center justify-center">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={onFileChange} 
                      className="hidden" 
                    />
                    <span className="text-sm text-blue-500">Change Photo</span>
                  </label>
                ) : (
                  <FiUser className="text-3xl text-blue-500 dark:text-blue-400" />
                )}
              </div>
              <div className="ml-6">
                <h2 className="text-xl font-bold">{profileData.name}</h2>
                <p className="text-blue-100">{profileData.department} Department</p>
                <p className="text-blue-100">{profileData.role}</p>
                {profileData.status && (
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium 
                    ${profileData.status === 'Active' ? 'bg-green-500' : 
                      profileData.status === 'On Leave' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {profileData.status}
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
                  <p className="p-2 text-gray-800 dark:text-white">{profileData.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">CNIC</label>
                  <p className="p-2 text-gray-800 dark:text-white">{profileData.cnic}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Department</label>
                  <p className="p-2 text-gray-800 dark:text-white">{profileData.department}</p>
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <FiMail className="mr-2" /> Email
                  </label>
                  <p className="p-2 text-gray-800 dark:text-white">{profileData.email}</p>
                </div>
                  <div>
                  <label className="flex items-center text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <FiPhone className="mr-2" /> Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={onInputChange}
                      className="p-2 w-full border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
                    />
                  ) : (
                    <p className="p-2 text-gray-800 dark:text-white">{profileData.phone}</p>
                  )}
                </div>
                
                <div>                  <label className="flex items-center text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <FiCalendar className="mr-2" /> Date of Birth
                  </label>
                  <p className="p-2 text-gray-800 dark:text-white">
                    {profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>

              {/* Professional Information & Emergency Contact */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Professional Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
                    <p className="p-2 text-gray-800 dark:text-white">{profileData.role}</p>
                  </div>
                    <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Current Salary</label>
                    <p className="p-2 text-gray-800 dark:text-white">
                      {profileData.currentSalary !== undefined ? profileData.currentSalary.toLocaleString() : 'Not available'}
                    </p>
                  </div>
                    <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Shift</label>
                    <p className="p-2 text-gray-800 dark:text-white">
                      {profileData.shift || 'Not available'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white">
                    <FiAlertTriangle className="mr-2 text-red-500" /> Emergency Contact
                  </h3>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contact Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="emergencyContactPhone"
                        value={editData.emergencyContactPhone}
                        onChange={onInputChange}
                        className="p-2 w-full border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
                      />
                    ) : (
                      <p className="p-2 text-gray-800 dark:text-white">{emergencyPhone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Relationship</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="emergencyContactRelationship"
                        value={editData.emergencyContactRelationship}
                        onChange={onInputChange}
                        className="p-2 w-full border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
                      />
                    ) : (
                      <p className="p-2 text-gray-800 dark:text-white">{emergencyRelationship}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add Save button when in edit mode */}
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onSubmit}
                  className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}