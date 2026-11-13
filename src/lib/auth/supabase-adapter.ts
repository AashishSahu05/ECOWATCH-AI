import { createClient } from "@/lib/supabase/client";
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
      if (!session) return null;

      const profile = await this.getCurrentUser();
      if (!profile) return null;

      return {
        accessToken: session.access_token,
        expiresAt: (session.expires_at || 0) * 1000,
        user: profile,
      };
    } catch {
      return null;
    }
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
        fullName: profile?.full_name || user.user_metadata?.full_name || "EcoWatch User",
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

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.session || !data.user) {
        return { success: false, error: "Failed to establish session." };
      }

      const profile = await this.getCurrentUser();
      if (!profile) {
        return { success: false, error: "Profile record missing." };
      }

      return {
        success: true,
        data: {
          accessToken: data.session.access_token,
          expiresAt: (data.session.expires_at || 0) * 1000,
          user: profile,
        },
      };
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
            // Security invariant: role is never trusted from user metadata
            role: "citizen",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Registration failed." };
      }

      const newProfile: UserProfile = {
        id: data.user.id,
        email: credentials.email,
        fullName: credentials.fullName,
        role: "citizen",
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: newProfile,
        message: "Account created successfully.",
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }

  async signOut(): Promise<AuthResult<null>> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, error: error.message };
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

