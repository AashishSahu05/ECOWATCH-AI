"use client";

import React, { Suspense } from "react";
import { CitizenSidebar } from "@/components/layout/CitizenSidebar";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFCF9]" />}>
      <CitizenSidebar>{children}</CitizenSidebar>
    </Suspense>
  );
}
