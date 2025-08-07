import { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import GridShape from "@/components/common/GridShape";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

export const metadata: Metadata = {
  title: "Authentication | Multi-Tenant Platform",
  description: "Login and signup pages for multi-tenant platform",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          {/* Left Side - Background with Logo */}
          <div className="relative hidden w-1/2 bg-gradient-to-br from-brand-500 to-brand-600 lg:block">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex h-full flex-col justify-between p-12 text-white">
              <div>
                <Link href="/" className="inline-block">
                  <Image
                    width={154}
                    height={32}
                    src="/images/logo/logo.svg"
                    alt="Logo"
                    className="brightness-0 invert"
                  />
                </Link>
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-bold">
                  Welcome to Multi-Tenant Platform
                </h1>
                <p className="text-lg text-white/80">
                  Manage your tenants, users, and system with our comprehensive admin dashboard.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">
                  © 2024 Multi-Tenant Platform. All rights reserved.
                </p>
                <ThemeToggleButton />
              </div>
            </div>
            <GridShape />
          </div>

          {/* Right Side - Auth Form */}
          <div className="flex w-full flex-col justify-center lg:w-1/2">
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
