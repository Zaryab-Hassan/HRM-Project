'use client';

import { Suspense } from 'react';
import PayrollComponent from '@/components/PayrollComponent';

// Wrap the main component export with Suspense boundary
export default function EmployeePayroll() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    }>
      <PayrollComponent 
        userRole="employee"
        apiEndpoint="/api/employee/payroll"
        title="My Payroll"
        showEmployeeName={false}
      />
    </Suspense>
  );
}