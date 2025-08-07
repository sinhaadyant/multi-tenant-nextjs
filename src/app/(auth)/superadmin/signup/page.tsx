import { Metadata } from "next";
import SuperAdminSignUpClient from "./SuperAdminSignUpClient";

export const metadata: Metadata = {
  title: "SuperAdmin Registration | Multi-Tenant Platform",
  description: "Secure SuperAdmin registration portal for multi-tenant platform administration",
};

export default function SuperAdminSignUp() {
  return <SuperAdminSignUpClient />;
} 