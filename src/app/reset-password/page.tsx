import React from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Update Password — EcoWatch AI",
  description: "Set a new password for your EcoWatch AI account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout
      heading="Set New Password"
      subheading="Choose a secure password containing at least 8 characters with a mix of letters and numbers."
    >
      <ResetPasswordForm />
    </AuthSplitLayout>
  );
}
