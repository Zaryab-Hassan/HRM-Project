import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { logActivity } from './middlewares/logMiddleware';

export default withAuth(
  async function middleware(req: any) {
    // Log page access for authenticated users
    if (req.nextauth.token) {
      await logActivity(req, NextResponse.next());
    }
    
    const role = req.nextauth.token?.role;
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
