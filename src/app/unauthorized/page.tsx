"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldAlert, ArrowLeft, Home, LogIn, LayoutDashboard } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, signOut } = useAuth();

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === "administrator") return "/admin/dashboard";
    if (user.role === "municipal_officer") return "/officer/dashboard";
    return "/citizen/dashboard";
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 text-center bg-brand-warm-white">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-subtle">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>

        <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50">
          Security Exception • 403 Forbidden
        </Badge>

        <h1 className="text-3xl sm:text-4xl font-extrabold font-manrope text-brand-deep-forest">
          Access Restricted by Policy
        </h1>

        <p className="text-sm text-brand-charcoal/80 font-inter leading-relaxed">
          Your active account does not have sufficient role permissions to view the requested destination.
          Nagardrishti AI enforces strict server-side authorization boundaries between Citizens, Municipal Officers, and Administrators.
        </p>

        {user && (
          <div className="p-3.5 rounded-xl bg-brand-soft-sage/40 border border-brand-forest-green/15 text-xs text-brand-charcoal/70">
            Current Session: <strong className="text-brand-deep-forest">{user.fullName}</strong> (Role: <span className="capitalize">{user.role.replace("_", " ")}</span>)
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <>
              <Button
                href={getDashboardHref()}
                variant="primary"
                size="md"
                icon={<LayoutDashboard className="w-4 h-4 text-[#FAFCF9]" />}
              >
                Go to My Dashboard
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => signOut()}
              >
                Switch Account
              </Button>
            </>
          ) : (
            <>
              <Button
                href="/login"
                variant="primary"
                size="md"
                icon={<LogIn className="w-4 h-4 text-[#FAFCF9]" />}
              >
                Sign In With Authorized Account
              </Button>
              <Button href="/" variant="outline" size="md">
                Return to Home
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

