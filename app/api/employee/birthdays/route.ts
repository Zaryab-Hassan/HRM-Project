import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectToDatabase from '../../../../lib/mongodb';
import Employee from '../../../../models/Employee';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get current date (month and day)
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const currentDay = today.getDate();

    // Find employees whose birthdays are today
    const employees = await Employee.find({}, 'name dob');
    
    const birthdaysToday = employees
      .filter(employee => {
        if (!employee.dob) return false;
        const dob = new Date(employee.dob);
        return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
      })
      .map(employee => employee.name);

    return NextResponse.json({ 
      success: true,
      birthdaysToday 
    });
    
  } catch (error) {
    console.error('Error fetching birthdays:', error);
    return NextResponse.json({ error: 'Failed to fetch birthdays' }, { status: 500 });
  }
}