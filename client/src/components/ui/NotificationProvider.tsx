"use client";

import React from "react";
import { Toaster } from "sonner";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
        duration={5000}
        toastOptions={{
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </>
  );
};
