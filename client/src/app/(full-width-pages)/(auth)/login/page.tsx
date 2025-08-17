import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Multi-Tenant SaaS Platform",
  description: "Sign in to your account to access the dashboard",
};

export default function LoginPage() {
  return <SignInForm />;
}


