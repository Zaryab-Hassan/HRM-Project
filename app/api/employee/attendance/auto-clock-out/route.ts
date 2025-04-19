import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function POST(req: Request) {
  try {
    await dbConnect();

    // This endpoint should be called by a cron job or scheduled task
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Validate request - check for API key or secret if this is exposed externally
    const { headers } = req;
    const apiKey = headers.get('x-api-key');
    
    // You might want to add API key validation here if this endpoint is public
    // if (apiKey !== process.env.AUTO_CLOCKOUT_API_KEY) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    try {
      // Find all employees who haven't clocked out today
      const employees = await Employee.find({
        'attendance': {
          $elemMatch: {
            date: {
              $gte: new Date(today),
              $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
            },
            clockIn: { $exists: true },
            clockOut: { $exists: false }
          }
        }
      });

      // Process each employee
      const updates = await Promise.all(
        employees.map(async (employee) => {
          // Skip if employee has no attendance array
          if (!Array.isArray(employee.attendance)) {
            return null;
          }
          
          const todayRecord = employee.attendance.find((record: any) => {
            if (!record || !record.date) return false;
            try {
              const recordDate = new Date(record.date).toISOString().split('T')[0];
              return recordDate === today;
            } catch (err) {
              console.error('Error parsing date:', err);
              return false;
            }
          });

          if (todayRecord && todayRecord.clockIn && !todayRecord.clockOut) {
            // Set auto clock-out
            todayRecord.clockOut = now;
            todayRecord.autoClockOut = true;

            // Calculate working hours
            try {
              const clockInTime = new Date(todayRecord.clockIn).getTime();
              const clockOutTime = now.getTime();
              todayRecord.hoursWorked = Math.round((clockOutTime - clockInTime) / (1000 * 60 * 60) * 100) / 100;
              
              await employee.save();
              return { 
                employeeId: employee._id, 
                name: `${employee.firstName} ${employee.lastName}`,
                clockOut: now 
              };
            } catch (err) {
              console.error(`Error processing auto clock-out for employee ${employee._id}:`, err);
              return null;
            }
          }
          return null;
        })
      );

      return NextResponse.json({
        success: true,
        data: updates.filter(Boolean),
        processedAt: now
      });
    } catch (dbError) {
      console.error('Database error during auto clock-out:', dbError);
      return NextResponse.json({ error: 'Database error during auto clock-out' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in auto clock-out:', error);
    return NextResponse.json(
      { error: 'Failed to process auto clock-out' },
      { status: 500 }
    );
  }
}
