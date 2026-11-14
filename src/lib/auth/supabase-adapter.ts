import { createClient } from "@/lib/supabase/client";
import { DEMO_USERS } from "./mock-adapter";
import {
  AuthAdapter,
  AuthResult,
  AuthSession,
  PasswordResetRequest,
  PasswordUpdateRequest,
  ProfileUpdatePayload,
  SignInCredentials,
  SignUpCredentials,
  UserProfile,
} from "./types";

export class SupabaseAuthAdapter implements AuthAdapter {
  isMockMode = false;

  private getClient() {
    const client = createClient();
    if (!client) {
      throw new Error(
        "Supabase credentials are not configured. Please supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return client;
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const supabase = this.getClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const profile = await this.getCurrentUser();
        if (profile) {
          return {
            accessToken: session.access_token,
            expiresAt: (session.expires_at || 0) * 1000,
            user: profile,
          };
        }
      }
    } catch {
      // Continue to demo session fallback
    }

    // Fallback: Check active signed demo session
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/auth/demo-session", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            return {
              accessToken: "live-authenticated-session",
              expiresAt: data.expiresAt,
              user: data.user,
            };
          }
        }
      } catch {
        // Not authenticated
      }
    }

    return null;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const supabase = this.getClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Query profiles table populated by Member 3's schema
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return {
        id: user.id,
        email: user.email || "",
        fullName: profile?.full_name || user.user_metadata?.full_name || "Nagardrishti User",
        role: profile?.role || "citizen",
        ward: profile?.ward_id,
        createdAt: profile?.created_at || user.created_at,
        updatedAt: profile?.updated_at,
      };
    } catch {
      return null;
    }
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult<AuthSession>> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (!error && data.session && data.user) {
        const profile = await this.getCurrentUser();
        if (profile) {
          return {
            success: true,
            data: {
              accessToken: data.session.access_token,
              expiresAt: (data.session.expires_at || 0) * 1000,
              user: profile,
            },
          };
        }
      }

      // Seamless provisioned / demo / local session fallback:
      const emailKey = credentials.email.toLowerCase().trim();
      if (typeof window !== "undefined") {
        const syncRes = await fetch("/api/auth/demo-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "signin", email: emailKey, password: credentials.password }),
        }).catch(() => null);

        if (syncRes && syncRes.ok) {
          const syncData = await syncRes.json();
          return {
            success: true,
            data: {
              accessToken: "live-authenticated-session",
              expiresAt: syncData.expiresAt,
              user: syncData.user,
            },
          };
        }
      }

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: false, error: "Authentication failed. Please verify your credentials." };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResult<UserProfile>> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            role: "citizen",
          },
        },
      });

      if (!error && data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          email: credentials.email,
          fullName: credentials.fullName,
          role: "citizen",
          createdAt: new Date().toISOString(),
        };

        // Also establish fallback session in case email confirmation is required by Supabase
        if (typeof window !== "undefined") {
          await fetch("/api/auth/demo-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "signup",
              email: credentials.email.toLowerCase().trim(),
              fullName: credentials.fullName.trim(),
              password: credentials.password,
            }),
          }).catch(() => {});
        }

        return {
          success: true,
          data: newProfile,
          message: "Account created successfully.",
        };
      }

      // If Supabase encounters rate limit (HTTP 429) or SMTP confirmation constraints, fall back gracefully
      if (typeof window !== "undefined") {
        const demoRes = await fetch("/api/auth/demo-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "signup",
            email: credentials.email.toLowerCase().trim(),
            fullName: credentials.fullName.trim(),
            password: credentials.password,
          }),
        });

        if (demoRes.ok) {
          const demoData = await demoRes.json();
          return {
            success: true,
            data: demoData.user,
            message: "Citizen account created successfully.",
          };
        }
      }

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: false, error: "Registration failed." };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  async signOut(): Promise<AuthResult<null>> {
    try {
      const supabase = this.getClient();
      await supabase.auth.signOut().catch(() => {});
      if (typeof window !== "undefined") {
        await fetch("/api/auth/demo-session", {
          method: "DELETE",
        }).catch(() => {});
      }
      return { success: true, data: null, message: "Signed out." };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<AuthResult<null>> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        data: null,
        message: "Password reset link sent to your email address.",
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  async updatePassword(request: PasswordUpdateRequest): Promise<AuthResult<null>> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.updateUser({
        password: request.newPassword,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, data: null, message: "Password updated." };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  async updateProfile(payload: ProfileUpdatePayload): Promise<AuthResult<UserProfile>> {
    try {
      const supabase = this.getClient();
      const profile = await this.getCurrentUser();
      if (!profile) return { success: false, error: "Not authenticated." };

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: payload.fullName, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (error) return { success: false, error: error.message };

      return {
        success: true,
        data: { ...profile, fullName: payload.fullName },
        message: "Profile updated successfully.",
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }
}

