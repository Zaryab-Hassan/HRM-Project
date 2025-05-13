'use client';

import { SessionProvider } from "next-auth/react";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AutoActivityLogger from '@/lib/autoLogger';

// Component that uses search params
function ErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  if (!error) return null;
  
  return (
    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative w-full max-w-7xl mx-auto mt-4" role="alert">
      <span className="block sm:inline">{error}</span>
    </div>
  );
}

// Fallback loading state
function ErrorMessageFallback() {
  return <div className="h-12"></div>; // Empty space for loading
}

export default function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes to keep it fresh
      refetchOnWindowFocus={true} // Refetch when window gains focus
    >
      <Suspense fallback={<ErrorMessageFallback />}>
        <ErrorMessage />
      </Suspense>
      
      {/* Auto-log user activities across the app */}
      <AutoActivityLogger />
      {children}
    </SessionProvider>
  );
}