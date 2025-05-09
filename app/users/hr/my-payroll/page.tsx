'use client';

import { useSession } from 'next-auth/react';
import PayrollComponent from '@/components/PayrollComponent';

export default function HRPayroll() {
  const { data: session, status } = useSession();
  
  return (
    <PayrollComponent
      userRole="hr"
      apiEndpoint="/api/employee/payroll" // Using employee payroll endpoint as specified in current implementation
      title="My Payroll"
      showEmployeeName={false} // Since it's the HR's personal payroll, we don't need to show employee name column
    />
  );
}