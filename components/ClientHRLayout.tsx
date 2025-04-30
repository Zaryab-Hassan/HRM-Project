'use client';

import React from "react";
import Hrnav from "./Hrnav";

export default function ClientHRLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Hrnav />
      <main>{children}</main>
    </>
  );
}