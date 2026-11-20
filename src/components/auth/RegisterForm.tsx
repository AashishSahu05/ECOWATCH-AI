"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const { signUp, isMockMode, user, isLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "administrator") {
        router.replace("/admin/dashboard");
      } else if (user.role === "municipal_officer") {
        router.replace("/officer/dashboard");
      } else {
        router.replace("/citizen/dashboard");
      }
    }
  }, [user, isLoading, router]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-gray-200" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score: 2, label: "Moderate", color: "bg-yellow-500" };
    return { score: 3, label: "Strong", color: "bg-brand-fresh-green" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (strength.score < 2) {
      setError("Password is too weak. Include a mix of uppercase letters, numbers, or symbols.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Registration failed.");
      return;
    }

    // Auto-navigates to citizen dashboard upon successful registration
    router.push("/citizen/dashboard");
    router.refresh();
  };

  return (
    <div className="space-y-3.5">
      {/* Role Policy Banner */}
      <div className="p-2.5 rounded-xl bg-brand-mint-cream/80 border border-brand-soft-sage text-[11px] text-brand-muted-slate flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-fresh-green shrink-0 mt-0.5" />
        <p className="leading-snug">
          <strong className="text-brand-deep-green font-manrope">Citizen Registration:</strong> Public signups
          are granted the <strong className="text-brand-deep-green">Citizen</strong> role. Municipal credentials are administrator-provisioned.
        </p>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
        {/* Full Name */}
        <div className="space-y-1">
          <label
            htmlFor="fullName"
            className="block text-[10px] font-bold font-manrope uppercase tracking-wider text-brand-deep-green"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 pointer-events-none" />
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Elena Vance"
              required
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/50 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-[10px] font-bold font-manrope uppercase tracking-wider text-brand-deep-green"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 pointer-events-none" />
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena.vance@example.org"
              required
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/50 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-[10px] font-bold font-manrope uppercase tracking-wider text-brand-deep-green"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              className="w-full pl-9 pr-9 py-1.5 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/50 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 hover:text-brand-deep-green p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Password strength meter */}
          {password && (
            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center justify-between text-[10px] text-brand-muted-slate">
                <span>Strength</span>
                <span className="font-semibold text-brand-deep-green">{strength.label}</span>
              </div>
              <div className="w-full h-1 bg-brand-soft-sage rounded-full overflow-hidden flex gap-1">
                <div
                  className={cn(
                    "h-full flex-1 rounded-full transition-all",
                    strength.score >= 1 ? strength.color : "bg-transparent"
                  )}
                />
                <div
                  className={cn(
                    "h-full flex-1 rounded-full transition-all",
                    strength.score >= 2 ? strength.color : "bg-transparent"
                  )}
                />
                <div
                  className={cn(
                    "h-full flex-1 rounded-full transition-all",
                    strength.score >= 3 ? strength.color : "bg-transparent"
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label
            htmlFor="confirmPassword"
            className="block text-[10px] font-bold font-manrope uppercase tracking-wider text-brand-deep-green"
          >
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/50 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-1">
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isSubmitting}
            className="py-2.5 text-xs sm:text-sm font-bold"
            icon={
              isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <UserPlus className="w-3.5 h-3.5 text-white" />
              )
            }
          >
            {isSubmitting ? "Creating Citizen Profile..." : "Create Citizen Account"}
          </Button>
        </div>
      </form>

      {/* Switch to Login */}
      <div className="text-center pt-2 text-xs text-brand-muted-slate border-t border-brand-soft-sage/80">
        Already registered?{" "}
        <Link
          href="/login"
          className="text-brand-emerald font-bold hover:text-brand-fresh-green hover:underline ml-1"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
