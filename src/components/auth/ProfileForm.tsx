"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "./RoleBadge";
import { Button } from "@/components/ui/Button";
import {
  User,
  Mail,
  Lock,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Save,
} from "lucide-react";

export function ProfileForm() {
  const { user, updateProfile, updatePassword, signOut } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!user) {
    return (
      <div className="p-8 text-center text-sm text-brand-charcoal/70">
        Loading user profile details...
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileError("Full name must be at least 2 characters.");
      return;
    }

    setIsUpdatingProfile(true);
    const result = await updateProfile({ fullName: fullName.trim() });
    setIsUpdatingProfile(false);

    if (result.success) {
      setProfileSuccess("Profile updated successfully.");
    } else {
      setProfileError(result.error || "Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    const result = await updatePassword({ newPassword });
    setIsUpdatingPassword(false);

    if (result.success) {
      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(result.error || "Failed to update password.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Identity Summary Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-brand-soft-sage/40 border border-brand-forest-green/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-brand-deep-forest text-brand-mint flex items-center justify-center font-bold text-lg font-manrope shadow-sm border border-brand-mint/30">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-manrope font-bold text-lg text-brand-deep-forest">
                {user.fullName}
              </h2>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-xs text-brand-charcoal/70 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          icon={<LogOut className="w-3.5 h-3.5 text-red-600" />}
          className="text-red-700 hover:bg-red-50 border-red-200 text-xs"
        >
          Sign Out
        </Button>
      </div>

      {/* Account Details & Role Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
        <div className="p-4 rounded-xl bg-white border border-brand-forest-green/10 space-y-1">
          <span className="text-brand-charcoal/60 uppercase tracking-wider font-mono text-[10px] block">
            System Assigned Role
          </span>
          <div className="flex items-center gap-2 pt-0.5">
            <RoleBadge role={user.role} size="md" />
            <span className="text-brand-charcoal/70 text-[11px]">
              (Verified via database policy)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-brand-forest-green/10 space-y-1">
          <span className="text-brand-charcoal/60 uppercase tracking-wider font-mono text-[10px] block">
            Registration Timestamp
          </span>
          <p className="font-mono text-brand-deep-forest font-semibold flex items-center gap-1.5 pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-brand-leaf-green" />
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </p>
        </div>

        {user.ward && (
          <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-white border border-brand-forest-green/10 space-y-1">
            <span className="text-brand-charcoal/60 uppercase tracking-wider font-mono text-[10px] block">
              Assigned Municipal Jurisdiction
            </span>
            <p className="font-medium text-brand-deep-forest flex items-center gap-1.5 pt-0.5">
              <Building className="w-3.5 h-3.5 text-brand-forest-green" />
              <span>{user.ward}</span>
            </p>
          </div>
        )}
      </div>

      {/* Profile Name Update Form */}
      <div className="bg-white rounded-2xl p-6 border border-brand-forest-green/15 space-y-4">
        <h3 className="font-manrope font-bold text-base text-brand-deep-forest">
          Personal Information
        </h3>

        {profileSuccess && (
          <div className="p-3 rounded-xl bg-brand-soft-sage/60 border border-brand-leaf-green/30 text-xs text-brand-forest-green flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-leaf-green shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="editFullName"
              className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
              <input
                type="text"
                id="editFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-warm-white/50 border border-brand-forest-green/20 text-sm text-brand-charcoal font-inter focus:outline-none focus:ring-2 focus:ring-brand-leaf-green/20 focus:border-brand-leaf-green"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest">
              Email Address (Fixed)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm text-brand-charcoal/60 font-inter cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isUpdatingProfile}
              icon={
                isUpdatingProfile ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-brand-mint" />
                )
              }
            >
              {isUpdatingProfile ? "Saving Changes..." : "Save Profile Details"}
            </Button>
          </div>
        </form>
      </div>

      {/* Password Update Form */}
      <div className="bg-white rounded-2xl p-6 border border-brand-forest-green/15 space-y-4">
        <h3 className="font-manrope font-bold text-base text-brand-deep-forest">
          Security & Password
        </h3>

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-brand-soft-sage/60 border border-brand-leaf-green/30 text-xs text-brand-forest-green flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-leaf-green shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="newPass"
                className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
                <input
                  type="password"
                  id="newPass"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-warm-white/50 border border-brand-forest-green/20 text-sm text-brand-charcoal font-inter focus:outline-none focus:ring-2 focus:ring-brand-leaf-green/20 focus:border-brand-leaf-green"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPass"
                className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-forest"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
                <input
                  type="password"
                  id="confirmPass"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brand-warm-white/50 border border-brand-forest-green/20 text-sm text-brand-charcoal font-inter focus:outline-none focus:ring-2 focus:ring-brand-leaf-green/20 focus:border-brand-leaf-green"
                />
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isUpdatingPassword}
              icon={
                isUpdatingPassword ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-brand-forest-green" />
                )
              }
            >
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

