import { Geist, Geist_Mono } from "next/font/google";
import "../../../app/globals.css";
import HRSidebar from "../../../components/HRSidebar";
import ClientSessionProvider from "../../../components/ClientSessionProvider";
import ActivityLogger from "@/components/ActivityLogger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function HRLayout({
  children,
}: Readonly<{
  children: React.ReactNode;  
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <ClientSessionProvider>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <HRSidebar />          <div className="flex-1 flex flex-col overflow-hidden pl-64">
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
              {/* Log HR dashboard access */}
              <ActivityLogger 
                module="dashboard" 
                details="HR accessed dashboard" 
              />
              {children}
            </main>
          </div>
        </div>
      </ClientSessionProvider>
    </div>
  );
}
