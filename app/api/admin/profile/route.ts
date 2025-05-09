import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

// Retrieves the logged-in HR/admin's profile data
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an admin/HR
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Admin access only' }, { status: 403 });
    }
    
    const userEmail = session.user.email;

    // Find admin by email, excluding sensitive fields like password
    const admin = await Admin.findOne({ email: userEmail }).select('-password');

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Return admin data
    return NextResponse.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Updates the logged-in admin's profile
export async function PATCH(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Admin access only' }, { status: 403 });
    }
    
    const userEmail = session.user.email;

    // Get form data
    const formData = await req.formData();
    const phone = formData.get('phone') as string;
    const emergencyContact = formData.get('emergencyContact') as string;
    
    // Find admin by email
    const admin = await Admin.findOne({ email: userEmail });
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Update fields
    if (phone) admin.phone = phone;
    if (emergencyContact) admin.emergencyContact = emergencyContact;
    
    // Check if a profile picture was uploaded
    const profilePicture = formData.get('profilePicture') as File;
    if (profilePicture) {
      // Handle profile picture upload
      // Implementation would depend on your file storage solution
      // For now, we'll just acknowledge it
      console.log('Profile picture uploaded:', profilePicture.name);
    }

    // Save changes
    await admin.save();

    // Return updated admin data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: admin
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
