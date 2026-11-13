"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

export function ForgotPasswordForm() {
  const { requestPasswordReset, isMockMode } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const result = await requestPasswordReset({ email: email.trim() });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Password reset request failed.");
      return;
    }

    setStatusMessage(
      result.message ||
        `Instructions have been simulated for ${email.trim()}. Check your inbox or proceed with demo credentials.`
    );
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5 text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-brand-forest-green text-brand-mint flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-brand-mint" />
        </div>
        <div>
          <h3 className="font-manrope font-bold text-lg text-brand-deep-forest">
            Recovery Instructions Dispatched
          </h3>
          <p className="mt-1.5 text-xs text-brand-charcoal/80 font-inter leading-relaxed max-w-sm mx-auto">
            {statusMessage}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button href="/login" variant="primary" size="md" fullWidth>
            Return to Login
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSubmitted(false)}
          >
            Try a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
        >
          Registered Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40 pointer-events-none" />
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="citizen@ecowatch.ai"
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
              <RefreshCw className="w-4 h-4 animate-spin text-brand-mint" />
            ) : (
              <KeyRound className="w-4 h-4 text-brand-mint" />
            )
          }
        >
          {isSubmitting ? "Processing Request..." : "Request Password Recovery"}
        </Button>
      </div>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-charcoal/70 hover:text-brand-deep-forest"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </form>
    </div>
  );
}

