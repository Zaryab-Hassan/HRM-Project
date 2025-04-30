'use client';

import { SessionProvider } from "next-auth/react";
import { useSearchParams } from 'next/navigation';

export default function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <SessionProvider refetchInterval={0} refetchWhenOffline={false}>
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative w-full max-w-7xl mx-auto mt-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {children}
    </SessionProvider>
  );
}