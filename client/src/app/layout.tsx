import { Outfit } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Providers } from "@/providers/Providers";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ErrorBoundary>
          <Providers>
            <ThemeProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </ThemeProvider>
          </Providers>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
