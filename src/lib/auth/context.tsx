"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./adapter";
import {
  AuthResult,
  AuthSession,
  PasswordResetRequest,
  PasswordUpdateRequest,
  ProfileUpdatePayload,
  SignInCredentials,
  SignUpCredentials,
  UserProfile,
  UserRole,
} from "./types";

interface AuthContextType {
  user: UserProfile | null;
  session: AuthSession | null;
  role: UserRole | null;
  isLoading: boolean;
  isMockMode: boolean;
  signIn: (credentials: SignInCredentials) => Promise<AuthResult<AuthSession>>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResult<UserProfile>>;
  signOut: () => Promise<void>;
  requestPasswordReset: (request: PasswordResetRequest) => Promise<AuthResult<null>>;
  updatePassword: (request: PasswordUpdateRequest) => Promise<AuthResult<null>>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<AuthResult<UserProfile>>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const activeSession = await auth.getSession();
      setSession(activeSession);
      setUser(activeSession ? activeSession.user : null);
    } catch {
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = async (credentials: SignInCredentials): Promise<AuthResult<AuthSession>> => {
    setIsLoading(true);
    const result = await auth.signIn(credentials);
    if (result.success && result.data) {
      setSession(result.data);
      setUser(result.data.user);
    }
    setIsLoading(false);
    return result;
  };

  const signUp = async (credentials: SignUpCredentials): Promise<AuthResult<UserProfile>> => {
    setIsLoading(true);
    const result = await auth.signUp(credentials);
    if (result.success && result.data) {
      // Auto-refresh session for citizen
      await refreshSession();
    }
    setIsLoading(false);
    return result;
  };

  const signOut = async () => {
    setIsLoading(true);
    await auth.signOut();
    setSession(null);
    setUser(null);
    setIsLoading(false);
    router.push("/");
    router.refresh();
  };

  const requestPasswordReset = async (
    request: PasswordResetRequest
  ): Promise<AuthResult<null>> => {
    return auth.requestPasswordReset(request);
  };

  const updatePassword = async (
    request: PasswordUpdateRequest
  ): Promise<AuthResult<null>> => {
    return auth.updatePassword(request);
  };

  const updateProfile = async (
    payload: ProfileUpdatePayload
  ): Promise<AuthResult<UserProfile>> => {
    const result = await auth.updateProfile(payload);
    if (result.success && result.data) {
      setUser(result.data);
      if (session) {
        setSession({ ...session, user: result.data });
      }
    }
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role: user ? user.role : null,
        isLoading,
        isMockMode: auth.isMockMode,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        updateProfile,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

