import { Metadata } from "next";
import SuperAdminSignInClient from "./SuperAdminSignInClient";

export const metadata: Metadata = {
  title: "SuperAdmin Login | Multi-Tenant Platform",
  description: "Secure SuperAdmin login portal for multi-tenant platform administration",
};

export default function SuperAdminSignIn() {
  return <SuperAdminSignInClient />;
}
