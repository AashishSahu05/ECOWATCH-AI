"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
} from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword({ newPassword });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Password update failed.");
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-brand-forest-green text-[#FAFCF9] flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-[#FAFCF9]" />
        </div>
        <h3 className="font-manrope font-bold text-lg text-brand-deep-forest">
          Password Updated Successfully
        </h3>
        <p className="text-xs text-brand-charcoal/80 font-inter leading-relaxed max-w-sm mx-auto">
          Your credentials have been securely updated. You can now access your dashboard with your new password.
        </p>
        <div className="pt-2">
          <Button href="/login" variant="primary" size="md" fullWidth>
            Continue to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="newPassword"
          className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
        >
          New Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            id="newPassword"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-brand-warm-white/50 border border-brand-forest-green/20 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 font-inter focus:outline-none focus:ring-2 focus:ring-brand-leaf-green/20 focus:border-brand-leaf-green transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/50 hover:text-brand-charcoal"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            required
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-warm-white/50 border border-brand-forest-green/20 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 font-inter focus:outline-none focus:ring-2 focus:ring-brand-leaf-green/20 focus:border-brand-leaf-green transition-all"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          icon={
            isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#FAFCF9]" />
            ) : (
              <KeyRound className="w-4 h-4 text-[#FAFCF9]" />
            )
          }
        >
          {isSubmitting ? "Updating Password..." : "Set New Password"}
        </Button>
      </div>
    </form>
  );
}

