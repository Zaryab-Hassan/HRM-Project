import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Employee from '@/models/Employee';

// Retrieves the logged-in HR's profile data
export async function GET(req: Request) {
  try {
    await dbConnect();

    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an HR
    if (session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Access denied: HR access only' }, { status: 403 });
    }
      const userEmail = session.user.email;
    console.log("Fetching HR profile for:", userEmail);
    
    // First check Admin model
    let hr = await Admin.findOne({ email: userEmail }).select('-password');
    
    // If not found in Admin, check Employee model with HR role
    if (!hr) {
      console.log("HR profile not found in Admin model, checking Employee model");
      hr = await Employee.findOne({ 
        email: userEmail,
        role: "hr" 
      }).select('-password');
    }

    if (!hr) {
      console.log("HR profile not found in any model");
      return NextResponse.json({ error: 'HR profile not found' }, { status: 404 });
    }

    console.log("HR profile found:", hr.name);
    
    // Return HR data
    return NextResponse.json({
      success: true,
      data: hr
    });
  } catch (error) {
    console.error('Error fetching HR profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Updates the logged-in HR's profile
export async function PATCH(req: Request) {
  try {
    await dbConnect();    // Use NextAuth session for authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user is an HR
    if (session.user.role !== 'hr') {
      return NextResponse.json({ error: 'Access denied: HR access only' }, { status: 403 });
    }
    
    const userEmail = session.user.email;    // Get form data
    const formData = await req.formData();
    const phone = formData.get('phone') as string;
    const emergencyContact = formData.get('emergencyContact') as string;
    
    // First check Admin model
    let hr = await Admin.findOne({ email: userEmail });
    
    // If not found in Admin, check Employee model with HR role
    if (!hr) {
      console.log("HR profile not found in Admin model for update, checking Employee model");
      hr = await Employee.findOne({ 
        email: userEmail,
        role: "hr" 
      });
    }
    
    if (!hr) {
      console.log("HR profile not found in any model for update");
      return NextResponse.json({ error: 'HR profile not found' }, { status: 404 });
    }

    // Update fields
    if (phone) hr.phone = phone;
    if (emergencyContact) hr.emergencyContact = emergencyContact;
    
    // Check if a profile picture was uploaded
    const profilePicture = formData.get('profilePicture') as File;
    if (profilePicture) {
      // Handle profile picture upload
      // Implementation would depend on your file storage solution
      console.log('Profile picture uploaded:', profilePicture.name);
    }

    // Save changes
    await hr.save();

    // Return updated HR data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: hr
    });
  } catch (error) {
    console.error('Error updating HR profile:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
