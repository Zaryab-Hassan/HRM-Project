'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "../../../app/globals.css";
import EmployeeSidebar from "../../../components/EmployeeSidebar";
import { useSearchParams } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function ClientEmployeeLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <EmployeeSidebar />
      <div className="flex-1 ml-64 p-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative w-full max-w-7xl mx-auto mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
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
