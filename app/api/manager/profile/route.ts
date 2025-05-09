import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import Manager from '@/models/Manager';

// Retrieves the logged-in manager's profile data
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is a manager
    if (session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied: Manager access only' }, { status: 403 });
    }
    
    const userEmail = session.user.email;

    // Find manager by email, excluding sensitive fields like password
    const manager = await Manager.findOne({ email: userEmail }).select('-password');

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Return manager data
    return NextResponse.json({
      success: true,
      data: manager
    });
  } catch (error) {
    console.error('Error fetching manager profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Updates the logged-in manager's profile
export async function PATCH(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is a manager
    if (session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied: Manager access only' }, { status: 403 });
    }

    const userEmail = session.user.email;

    // Process form data
    const formData = await req.formData();
    const updateData: { [key: string]: any } = {};

    // Extract fields from form data
    if (formData.has('phone')) {
      updateData.phone = formData.get('phone');
    }
    
    if (formData.has('emergencyContact')) {
      updateData.emergencyContact = formData.get('emergencyContact');
    }

    // Handle profile picture upload if present
    if (formData.has('profilePicture')) {
      const profilePicture = formData.get('profilePicture') as File;
      
      // Here you would typically:
      // 1. Upload the file to a storage service like AWS S3
      // 2. Get back a URL to the uploaded file
      // 3. Store that URL in the database
      
      // For this implementation, we'll assume you have a function to handle the upload
      // and store the resulting URL in updateData.profilePictureUrl
      
      // Example placeholder (replace with actual upload logic):
      // const uploadResult = await uploadFile(profilePicture);
      // updateData.profilePictureUrl = uploadResult.url;
      
      // For now, we'll just acknowledge the picture was received
      console.log('Profile picture received:', profilePicture.name);
    }

    // Update manager in database and return updated data
    const updatedManager = await Manager.findOneAndUpdate(
      { email: userEmail },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedManager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedManager,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating manager profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
