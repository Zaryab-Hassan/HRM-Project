// app/employees/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface EmployeeProfile {
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
  status?: string;
  managerId?: string;
}

export default function UserProfile() {  const router = useRouter();
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    profilePicture: null as File | null
  });
    useEffect(() => {
    // Check authentication
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Fetch employee profile data
    const fetchEmployeeProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/employee/profile');
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/?error=Session expired. Please login again.');
            return;
          }
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        setProfileData(data.data);
        
        // Initialize edit form data
        if (data.data) {
          const emergencyContactParts = data.data.emergencyContact.split(',');
          setEditData({
            phone: data.data.phone || '',
            emergencyContactName: emergencyContactParts[0] || '',
            emergencyContactPhone: emergencyContactParts[1] || '',
            emergencyContactRelationship: emergencyContactParts[2] || '',
            profilePicture: null
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchEmployeeProfile();
    }
  }, [status, router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditData(prev => ({
        ...prev,
        profilePicture: e.target.files![0]
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a FormData object to handle file upload
      const formData = new FormData();
      formData.append('phone', editData.phone);
      
      // Combine emergency contact info into a comma-separated string
      const emergencyContact = `${editData.emergencyContactName},${editData.emergencyContactPhone},${editData.emergencyContactRelationship}`;
      formData.append('emergencyContact', emergencyContact);
      
      if (editData.profilePicture) {
        formData.append('profilePicture', editData.profilePicture);
      }
      
      const response = await fetch('/api/employee/profile', {
        method: 'PATCH',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const result = await response.json();
      
      // Update profile data with the updated info
      if (result.data) {
        setProfileData(result.data);
      }
      
      // Exit edit mode
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };
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

  // Parse emergency contact information (assuming it's stored as a string)
  const emergencyContactInfo = profileData.emergencyContact.split(',');
  const emergencyName = emergencyContactInfo[0] || 'Not provided';
  const emergencyPhone = emergencyContactInfo[1] || 'Not provided';
  const emergencyRelationship = emergencyContactInfo[2] || 'Not provided';

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
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
                      onChange={handleFileChange} 
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
                      onChange={handleInputChange}
                      className="p-2 w-full border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
                    />
                  ) : (
                    <p className="p-2 text-gray-800 dark:text-white">{profileData.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="flex items-center text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    <FiCalendar className="mr-2" /> Date of Birth
                  </label>
                  <p className="p-2 text-gray-800 dark:text-white">{new Date(profileData.dob).toLocaleDateString()}</p>
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
                    <p className="p-2 text-gray-800 dark:text-white">{profileData.currentSalary.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Shift</label>
                    <p className="p-2 text-gray-800 dark:text-white">{profileData.shift}</p>
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                  onClick={handleSubmit}
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