import React from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Password Recovery — EcoWatch AI",
  description: "Recover access to your EcoWatch AI citizen or municipal account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      heading="Reset Your Password"
      subheading="Enter the email address registered with your EcoWatch AI account to receive recovery instructions."
    >
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
