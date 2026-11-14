import React, { Suspense } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Nagardrishti AI — AI-Driven Urban Ecosystem Intelligence",
  description:
    "Intelligent civic waste infrastructure and automated municipal incident triage platform.",
};

export default function RootEntryPage() {
  return (
    <AuthSplitLayout
      heading="Welcome to Nagardrishti AI"
      subheading="Sign in to access your ecological monitoring and municipal console."
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
