import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Manager from '@/models/Manager';
import Admin from '@/models/Admin';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Try to find admin first
    const admin = await Admin.findOne({ email });
    if (admin) {
      const isValid = await admin.comparePassword(password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { 
          id: admin._id, 
          email: admin.email, 
          role: 'admin',
          permissions: admin.permissions 
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      const response = NextResponse.json({ token, role: 'admin' });
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });
      
      response.cookies.set({
        name: 'role',
        value: 'admin',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });

      return response;
    }

    // Try to find manager
    const manager = await Manager.findOne({ email });
    if (manager) {
      const isValid = await manager.comparePassword(password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { 
          id: manager._id, 
          email: manager.email, 
          role: 'manager',
          department: manager.department,
          permissions: manager.permissions 
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      const response = NextResponse.json({ token, role: 'manager' });
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });
      
      response.cookies.set({
        name: 'role',
        value: 'manager',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });

      return response;
    }

    // Try to find employee
    const employee = await Employee.findOne({ email });
    if (employee) {
      const isValid = await employee.comparePassword(password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        { 
          id: employee._id, 
          email: employee.email,
          role: 'employee',
          department: employee.department
        },
        JWT_SECRET,
        { expiresIn: '1d' }
      );

      const response = NextResponse.json({ token, role: 'employee' });
      
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });

      response.cookies.set({
        name: 'role',
        value: 'employee',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
