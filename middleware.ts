import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { logActivity } from './middlewares/logMiddleware';

export default withAuth(
  async function middleware(req: any) {
    // Handle Vercel deployment specific modifications
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Debugging in middleware
    console.log('Middleware - Current path:', req.nextUrl.pathname);
    console.log('Middleware - User role:', req.nextauth.token?.role);
    
    // Check if we have a token before logging activity
    // In production environments, we'll skip activity logging temporarily to focus on auth
    if (req.nextauth.token && !isProduction) {
      try {
        await logActivity(req, NextResponse.next());
      } catch (error) {
        console.error("Error logging activity:", error);
        // Continue even if logging fails
      }
    }
    
    const role = req.nextauth.token?.role || 'employee'; // Default to employee if no role
    const path = req.nextUrl.pathname;

    // Admin (HR) can access everything
    if (role === 'hr') {
      // If an HR user is on an employee or manager page, redirect them to HR pages
      if (path.startsWith('/users/employee') || path.startsWith('/users/manager')) {
        return NextResponse.redirect(new URL('/users/hr', req.url));
      }
      return NextResponse.next();
    }

    // Manager route restrictions
    if (role === 'manager') {
      if (path.startsWith('/users/employee') || path.startsWith('/users/hr')) {
        return NextResponse.redirect(new URL('/users/manager', req.url));
      }
    }

    // Employee route restrictions
    if (role === 'employee') {
      if (path.startsWith('/users/manager') || path.startsWith('/users/hr')) {
        return NextResponse.redirect(new URL('/users/employee', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: ['/users/:path*']
}
