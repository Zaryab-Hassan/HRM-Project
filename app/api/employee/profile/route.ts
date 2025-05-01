import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

// Retrieves the logged-in employee's profile data
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an employee
    if (session.user.role !== 'employee') {
      return NextResponse.json({ error: 'Access denied: Employee access only' }, { status: 403 });
    }
    
    const userEmail = session.user.email;

    // Find employee by email, excluding sensitive fields like password
    const employee = await Employee.findOne({ email: userEmail }).select('-password');

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: employee
    });
    
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

// Updates the employee profile information (only specific fields)
export async function PATCH(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an employee
    if (session.user.role !== 'employee') {
      return NextResponse.json({ error: 'Access denied: Employee access only' }, { status: 403 });
    }
    
    const userEmail = session.user.email;

    // Get the form data
    const formData = await req.formData();
    
    // Extract the fields we allow to be updated
    const phone = formData.get('phone') as string;
    const emergencyContact = formData.get('emergencyContact') as string;
    
    // Optional: handle profile picture upload
    // In a real implementation, you would upload this to a storage service
    // and save the URL in the database
    const profilePicture = formData.get('profilePicture') as File;
    let profilePictureUrl = null;
    
    if (profilePicture) {
      // This is a placeholder for actual file upload logic
      // In a real app, you would upload to a service like AWS S3, Cloudinary, etc.
      // and get back a URL to store
      console.log(`Profile picture received: ${profilePicture.name}, size: ${profilePicture.size}`);
      profilePictureUrl = `/uploads/profiles/${userEmail}-${Date.now()}-${profilePicture.name}`;
    }

    // Update the employee record
    const updateFields: Record<string, any> = {};
    
    if (phone) updateFields.phone = phone;
    if (emergencyContact) updateFields.emergencyContact = emergencyContact;
    if (profilePictureUrl) updateFields.profilePicture = profilePictureUrl;
    
    const updatedEmployee = await Employee.findOneAndUpdate(
      { email: userEmail },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedEmployee
    });
    
  } catch (error) {
    console.error('Error updating employee profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
