'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserProfile, { EmployeeProfile } from '@/components/UserProfile';

export default function HRProfilePage() {
  const router = useRouter();
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

  // Parse emergency contact information safely
  const parseEmergencyContact = (contact: string | undefined) => {
    if (!contact) return { name: 'Not provided', phone: 'Not provided', relationship: 'Not provided' };
    
    const parts = contact.split(',');
    return {
      name: parts[0] || 'Not provided',
      phone: parts[1] || 'Not provided',
      relationship: parts[2] || 'Not provided'
    };
  };

  useEffect(() => {
    // Check authentication
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }    // Fetch HR/admin profile data
    const fetchHRProfile = async () => {
      try {
        setLoading(true);        const response = await fetch('/api/hr/profile');
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/?error=Session expired. Please login again.');
            return;
          }
          
          // Get more detailed error information
          const errorData = await response.json().catch(e => ({ error: 'Could not parse error response' }));
          console.error('API response error:', response.status, errorData);
          throw new Error(`Failed to fetch profile data: ${response.status} ${errorData.error || ''}`);
        }
        
        const data = await response.json();
        
        // Convert admin data to EmployeeProfile format for compatibility with UserProfile component
        const adminProfile: EmployeeProfile = {
          _id: data.data._id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role || 'admin',
          department: 'Human Resources',
          cnic: data.data.cnic || '',
          phone: data.data.phone || '',
          emergencyContact: data.data.emergencyContact,
          dob: data.data.dob || '',
          shift: data.data.shift || 'Day',
          initialSalary: data.data.initialSalary,
          currentSalary: data.data.currentSalary,
          status: data.data.status || 'Active'
        };
        
        setProfileData(adminProfile);
        
        // Initialize edit form data
        const emergencyContact = parseEmergencyContact(data.data.emergencyContact);
        setEditData({
          phone: data.data.phone || '',
          emergencyContactName: emergencyContact.name,
          emergencyContactPhone: emergencyContact.phone,
          emergencyContactRelationship: emergencyContact.relationship,
          profilePicture: null
        });      } catch (err) {
        console.error('Error fetching profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile data';
        setError(`Error: ${errorMessage}. Please check if the HR profile API endpoint is set up correctly.`);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchHRProfile();
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
        const response = await fetch('/api/hr/profile', {
        method: 'PATCH',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const result = await response.json();
      
      // Update profile data with the updated info
      if (result.data) {
        // Convert admin data to EmployeeProfile format
        const adminProfile: EmployeeProfile = {
          _id: result.data._id,
          name: result.data.name,
          email: result.data.email,
          role: result.data.role || 'admin',
          department: 'Human Resources',
          cnic: result.data.cnic || '',
          phone: result.data.phone || '',
          emergencyContact: result.data.emergencyContact,
          dob: result.data.dob || '',
          shift: result.data.shift || 'Day',
          initialSalary: result.data.initialSalary,
          currentSalary: result.data.currentSalary,
          status: result.data.status || 'Active'
        };
        
        setProfileData(adminProfile);
      }
      
      // Exit edit mode
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  return (
    <UserProfile
      profileData={profileData}
      loading={loading}
      error={error}
      isEditing={isEditing}
      editData={editData}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onInputChange={handleInputChange}
      onFileChange={handleFileChange}
      onSubmit={handleSubmit}
    />
  );
}