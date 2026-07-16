"use client";
import React from "react";
import { RealtimeProvider } from "@/context/RealtimeProvider";
import NotificationToast from "@/components/NotificationToast";

export default function DashboardGroupLayout({ children }) {
  return (
    <RealtimeProvider>
      {children}
      <NotificationToast />
    </RealtimeProvider>
  );
}
