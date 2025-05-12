'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "../../../app/globals.css";
import EmployeeSidebar from "../../../components/EmployeeSidebar";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ActivityLogger from '@/components/ActivityLogger';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Component that uses search params
function ErrorAlert() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  if (!error) return null;
  
  return (
    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative w-full max-w-7xl mx-auto mb-4" role="alert">
      <span className="block sm:inline">{error}</span>
    </div>
  );
}

// Fallback loading state
function ErrorAlertFallback() {
  return <div className="h-12"></div>; // Empty space for loading
}

function ClientEmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <EmployeeSidebar />
      <div className="flex-1 ml-64 p-6">
        <Suspense fallback={<ErrorAlertFallback />}>
          <ErrorAlert />
        </Suspense>
        {/* Log employee dashboard access */}
        <ActivityLogger 
          module="dashboard" 
          details="Employee accessed dashboard" 
        />
        {children}
      </div>
    </div>
  );
}

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;  
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <ClientEmployeeLayout>
        {children}
      </ClientEmployeeLayout>
    </div>
  );
}
