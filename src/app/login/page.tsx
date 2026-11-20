import React, { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In — NagarDrishti AI",
  description:
    "Secure role-based access for Citizens, Municipal Officers, and System Administrators.",
};

export default function LoginPage() {
  return (
    <AuthSplitLayout
      heading="Welcome to NagarDrishti AI"
      subheading="Sign in to access your NagarDrishti portal."
    >
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs font-mono text-brand-muted-slate">
            Loading authentication portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
