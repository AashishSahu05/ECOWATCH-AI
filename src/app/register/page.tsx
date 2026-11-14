import React, { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Citizen Registration — Nagardrishti AI",
  description:
    "Create a verified citizen account to report unmanaged waste, access AI sorting guidance, and track local remediation.",
};

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      heading="Citizen Registration"
      subheading="Join your local municipal ward network to access AI sorting guidance and transparent cleanup tracking."
      isRegister
    >
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs font-mono text-brand-muted-slate">
            Loading registration portal...
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
