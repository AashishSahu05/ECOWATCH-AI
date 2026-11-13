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
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect");

  const { signIn, user, isLoading } = useAuth();

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
      setError(result.error || "Authentication failed. Please verify your credentials.");
      return;
    }

    const verifiedRole = result.data.user.role;

    // Direct to explicit redirect or authorized dashboard
    if (redirectTarget && redirectTarget.startsWith("/")) {
      router.push(redirectTarget);
      router.refresh();
      return;
    }

    if (verifiedRole === "administrator") {
      router.push("/admin/dashboard");
    } else if (verifiedRole === "municipal_officer") {
      router.push("/officer/dashboard");
    } else {
      router.push("/citizen/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {/* Email Input */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-[10px] font-bold font-manrope uppercase tracking-wider text-brand-deep-green"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 pointer-events-none" />
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="name@company.com"
              required
              autoComplete="email"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/40 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
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
              className="text-[11px] font-medium text-brand-emerald hover:text-[#133A29] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className="w-full pl-9 pr-10 py-2 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs sm:text-sm text-brand-deep-green placeholder:text-brand-muted-slate/40 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted-slate/60 hover:text-brand-deep-green p-0.5 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-brand-soft-sage text-brand-emerald focus:ring-brand-emerald/20"
            />
            <span className="text-[11px] text-brand-muted-slate font-inter">
              Remember me on this device
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="pt-1">
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isSubmitting}
            icon={
              isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LogIn className="w-4 h-4 text-white" />
              )
            }
          >
            {isSubmitting ? "Authenticating..." : "Sign In"}
          </Button>
        </div>
      </form>

      {/* Citizen Registration Link */}
      <div className="text-center pt-2 border-t border-brand-soft-sage/60">
        <p className="text-xs text-brand-muted-slate font-inter">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-brand-emerald hover:text-[#133A29] hover:underline"
          >
            Create Citizen Account
          </Link>
        </p>
      </div>
    </div>
  );
}
