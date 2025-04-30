import { Geist, Geist_Mono } from "next/font/google";
import "../../../app/globals.css";
import ClientHRLayout from "../../../components/ClientHRLayout";

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
      <ClientHRLayout>
        {children}
      </ClientHRLayout>
    </div>
  );
}
