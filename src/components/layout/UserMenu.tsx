"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Button } from "@/components/ui/Button";
import {
  User,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  LogIn,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, signOut, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-brand-soft-sage animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-xs lg:text-sm px-4 py-2 rounded-xl bg-[#143F2D] text-[#FAFCF9] hover:bg-[#23523F] font-bold transition-all shadow-sm flex items-center gap-1.5"
        >
          <LogIn className="w-3.5 h-3.5 text-[#FAFCF9]" />
          <span>Sign In</span>
        </Link>
      </div>
    );
  }

  const getDashboardHref = () => {
    if (user.role === "administrator") return "/admin/dashboard";
    if (user.role === "municipal_officer") return "/officer/dashboard";
    return "/citizen/dashboard";
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-[#F1F5F3] transition-colors focus:outline-none focus:ring-2 focus:ring-[#143F2D]/20 text-[#143F2D]"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-[#143F2D] text-[#FAFCF9] flex items-center justify-center font-bold text-xs font-manrope shadow-sm border border-[#23523F]">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold font-manrope text-[#143F2D] leading-tight truncate max-w-[140px]">
            {user.fullName}
          </span>
          <span className="text-[10px] text-[#4A6558] capitalize font-mono leading-none">
            {user.role.replace("_", " ")}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#4A6558]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-brand-forest-green/15 shadow-card p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header user identity */}
          <div className="p-3 border-b border-brand-forest-green/10 mb-1 space-y-1">
            <p className="text-xs font-bold font-manrope text-brand-deep-forest truncate">
              {user.fullName}
            </p>
            <p className="text-[11px] text-brand-charcoal/60 truncate font-mono">
              {user.email}
            </p>
            <div className="pt-1">
              <RoleBadge role={user.role} size="sm" />
            </div>
          </div>

          {/* Links */}
          <div className="space-y-0.5 text-xs font-medium">
            <Link
              href={getDashboardHref()}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-brand-charcoal hover:text-brand-deep-forest hover:bg-brand-soft-sage/70 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-forest-green" />
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-brand-charcoal hover:text-brand-deep-forest hover:bg-brand-soft-sage/70 transition-colors"
            >
              <Settings className="w-4 h-4 text-brand-forest-green" />
              <span>Profile & Credentials</span>
            </Link>

            <Link
              href="/profile#support"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-brand-charcoal hover:text-brand-deep-forest hover:bg-brand-soft-sage/70 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-brand-forest-green" />
              <span>Help & Support</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="pt-1 mt-1 border-t border-brand-forest-green/10">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

