"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  RefreshCw,
  UserCheck,
  Building2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Persona {
  role: string;
  roleKey: "citizen" | "municipal_officer" | "administrator";
  email: string;
  defaultPass: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}

const DEMO_PERSONAS: Persona[] = [
  {
    role: "Citizen",
    roleKey: "citizen",
    email: "citizen@ecowatch.ai",
    defaultPass: "Demo@123",
    icon: UserCheck,
    hint: "Waste segregation & civic dumping reporting",
  },
  {
    role: "Municipal Officer",
    roleKey: "municipal_officer",
    email: "officer@ecowatch.ai",
    defaultPass: "Demo@123",
    icon: Building2,
    hint: "Ward 04 incident triage & cleanup verification",
  },
  {
    role: "Administrator",
    roleKey: "administrator",
    email: "admin@ecowatch.ai",
    defaultPass: "Demo@123",
    icon: ShieldCheck,
    hint: "Citywide analytics & platform governance",
  },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const { signIn, isMockMode, user, isLoading } = useAuth();

  const [selectedPersona, setSelectedPersona] = useState<Persona>(DEMO_PERSONAS[0]);
  // Email and password start empty (no prefill)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already signed in
  useEffect(() => {
    if (!isLoading && user) {
      if (redirectTarget && redirectTarget.startsWith("/")) {
        router.replace(redirectTarget);
      } else if (user.role === "administrator") {
        router.replace("/admin/dashboard");
      } else if (user.role === "municipal_officer") {
        router.replace("/officer/dashboard");
      } else {
        router.replace("/citizen/dashboard");
      }
    }
  }, [user, isLoading, router, redirectTarget]);

  const handleRoleSelect = (p: Persona) => {
    setSelectedPersona(p);
    setError(null);
  };

  const handleAutofill = () => {
    setEmail(selectedPersona.email);
    setPassword(selectedPersona.defaultPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please provide both email address and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn({ email: trimmedEmail, password });
    setIsSubmitting(false);

    if (!result.success || !result.data) {
      // User-friendly error message without technical internal variables
      const friendlyError = isMockMode
        ? "Invalid demo credentials. Please verify your email and password, or use the autofill helper below."
        : result.error || "Authentication failed. Please verify your credentials.";
      setError(friendlyError);
      return;
    }

    const verifiedRole = result.data.user.role;

    // Direct to explicit redirect or authorized dashboard
    if (redirectTarget && redirectTarget.startsWith("/")) {
      router.push(redirectTarget);
      return;
    }

    if (verifiedRole === "administrator") {
      router.push("/admin/dashboard");
    } else if (verifiedRole === "municipal_officer") {
      router.push("/officer/dashboard");
    } else {
      router.push("/citizen/dashboard");
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Database-Pending Demo Status Indicator */}
      {isMockMode && (
        <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-[11px] font-inter animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-semibold font-mono tracking-tight text-[11px]">
              DEMO MODE — Database integration pending
            </span>
          </div>
          <span className="text-[10px] text-amber-700/80 font-mono hidden sm:inline">
            Mock Telemetry
          </span>
        </div>
      )}

      {/* 2. Three-Role Selector Tabs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold font-manrope uppercase tracking-wider text-brand-deep-green text-[10px]">
            Portal Access Role
          </label>
          <span className="text-[10px] text-brand-muted-slate font-inter">
            Select role to sign in
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-brand-mint-cream/80 border border-brand-soft-sage">
          {DEMO_PERSONAS.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPersona.roleKey === p.roleKey;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => handleRoleSelect(p)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer",
                  isSelected
                    ? "bg-brand-emerald text-white shadow-xs font-bold"
                    : "text-brand-deep-green hover:bg-white/80 font-medium"
                )}
                aria-pressed={isSelected}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5 mb-0.5 shrink-0",
                    isSelected ? "text-brand-lemon" : "text-brand-emerald"
                  )}
                />
                <span className="text-[10px] sm:text-[11px] font-manrope leading-tight truncate w-full">
                  {p.role}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] font-inter text-brand-muted-slate text-center pt-0.5 truncate">
          {selectedPersona.hint}
        </p>
      </div>

      {/* 3. Demo Credentials Quick-Helper Card (Demo Mode Only) */}
      {isMockMode && (
        <div className="p-2.5 rounded-xl bg-brand-mint-cream/50 border border-brand-soft-sage text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-brand-deep-green font-manrope font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3 h-3 text-brand-emerald shrink-0" />
              Demo Account: {selectedPersona.role}
            </span>
            <button
              type="button"
              onClick={handleAutofill}
              className="text-[10px] font-bold text-brand-emerald hover:text-brand-fresh-green underline cursor-pointer"
            >
              Autofill demo credentials
            </button>
          </div>
          <div className="font-mono text-[11px] text-brand-muted-slate flex items-center justify-between">
            <span>{selectedPersona.email}</span>
            <span className="text-brand-charcoal/60 font-semibold">{selectedPersona.defaultPass}</span>
          </div>
        </div>
      )}

      {/* 4. Error Message (Sanitized) */}
      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 5. Sign-in Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* Email Field */}
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
              placeholder="e.g. user@ecowatch.ai"
              required
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/50 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[10px] font-bold font-manrope uppercase tracking-wider text-brand-deep-green"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-brand-emerald hover:text-brand-fresh-green hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/50 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
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
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-2 pt-0.5">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-brand-soft-sage text-brand-emerald focus:ring-brand-emerald accent-brand-emerald"
          />
          <label htmlFor="rememberMe" className="text-xs text-brand-muted-slate cursor-pointer select-none">
            Keep me signed in on this device
          </label>
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
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-lemon" />
              ) : (
                <LogIn className="w-3.5 h-3.5 text-brand-lemon" />
              )
            }
          >
            {isSubmitting
              ? "Authenticating Session..."
              : `Sign In as ${selectedPersona.role}`}
          </Button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-2 text-xs text-brand-muted-slate border-t border-brand-soft-sage/80">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-brand-emerald font-bold hover:text-brand-fresh-green hover:underline ml-1"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
