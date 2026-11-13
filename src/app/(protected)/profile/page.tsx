import React from "react";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { HelpCircle, Mail, ShieldAlert, Sparkles } from "lucide-react";

export const metadata = {
  title: "Account Profile — EcoWatch AI",
  description: "Manage your EcoWatch AI user profile and security credentials.",
};

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="pb-4 border-b border-brand-soft-sage">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
          Account Profile & Security
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted-slate font-inter mt-1">
          Review your verified system role, update personal details, and configure account credentials.
        </p>
      </div>

      <ProfileForm />

      {/* Relocated In-App Support & Assistance Section */}
      <section
        id="support"
        className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-4"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-brand-soft-sage/80">
          <div className="w-10 h-10 rounded-xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-manrope font-bold text-lg text-brand-deep-green">
              Help & Municipal Support
            </h2>
            <p className="text-xs text-brand-muted-slate font-inter">
              Direct assistance channels for authenticated EcoWatch AI operators and citizens.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
          <div className="p-4 rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage space-y-2">
            <span className="font-mono font-bold text-brand-deep-green flex items-center gap-1.5 uppercase text-[11px]">
              <Mail className="w-3.5 h-3.5 text-brand-fresh-green" />
              Direct Support Desk
            </span>
            <p className="text-brand-muted-slate text-xs leading-relaxed">
              For urgent technical issues, account verification, or ward boundary revisions, reach our municipal support team.
            </p>
            <p className="font-mono text-brand-deep-green font-semibold pt-1">
              support@ecowatch.ai
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage space-y-2">
            <span className="font-mono font-bold text-brand-deep-green flex items-center gap-1.5 uppercase text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-fresh-green" />
              SLA Commitments
            </span>
            <p className="text-brand-muted-slate text-xs leading-relaxed">
              Critical platform incidents are triaged within 2 hours. Citizen inquiries and feedback reports are resolved within 24 business hours.
            </p>
            <p className="font-mono text-brand-fresh-green font-semibold pt-1">
              Ward 04 Response SLA: Active
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

