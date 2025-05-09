// filepath: d:\HRM-Project\app\users\manager\myprofile\page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserProfile, { EmployeeProfile } from '@/components/UserProfile';

export default function ManagerProfilePage() {
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
    }

    // Fetch manager profile data
    const fetchManagerProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/manager/profile');
        
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
          const emergencyContact = parseEmergencyContact(data.data.emergencyContact);
          setEditData({
            phone: data.data.phone || '',
            emergencyContactName: emergencyContact.name,
            emergencyContactPhone: emergencyContact.phone,
            emergencyContactRelationship: emergencyContact.relationship,
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
      fetchManagerProfile();
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
      
      const response = await fetch('/api/manager/profile', {
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