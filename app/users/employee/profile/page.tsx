// app/employees/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserProfile, { EmployeeProfile } from '@/components/UserProfile';
import { logActivity } from '@/lib/activityLogger';
import ActivityLogger from '@/components/ActivityLogger';

export default function EmployeeProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Log profile view
  useEffect(() => {
    if (session?.user) {
      logActivity('view', 'profile', 'Viewed employee profile');
    }
  }, [session]);
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
      
      // Log profile update
      logActivity('update', 'profile', 'Updated employee profile information');
      
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