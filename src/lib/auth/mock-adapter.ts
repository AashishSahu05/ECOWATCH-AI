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

export const DEMO_USERS: Record<string, UserProfile & { passwordHash: string }> = {
  "citizen@ecowatch.ai": {
    id: "usr_citizen_001",
    email: "citizen@ecowatch.ai",
    fullName: "Maya Lin (Citizen)",
    role: "citizen",
    createdAt: "2026-01-15T08:00:00Z",
    passwordHash: "Citizen@123",
  },
  "officer@ecowatch.ai": {
    id: "usr_officer_002",
    email: "officer@ecowatch.ai",
    fullName: "Marcus Bennett (Ward Officer)",
    role: "municipal_officer",
    ward: "Ward 04 — Central Transit Corridor",
    createdAt: "2026-01-10T09:30:00Z",
    passwordHash: "Officer@123",
  },
  "admin@ecowatch.ai": {
    id: "usr_admin_003",
    email: "admin@ecowatch.ai",
    fullName: "Dr. Elena Vance (Administrator)",
    role: "administrator",
    createdAt: "2026-01-01T00:00:00Z",
    passwordHash: "Admin@123",
  },
  "ahtp@eco.com": {
    id: "usr_admin_ahtp_001",
    email: "ahtp@eco.com",
    fullName: "Aashish Sahu (Administrator)",
    role: "administrator",
    createdAt: "2026-01-01T00:00:00Z",
    passwordHash: "ahtp@123",
  },
};

const SESSION_COOKIE_NAME = "ecowatch_auth_session";

function getBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setBrowserCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function clearBrowserCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export class MockAuthAdapter implements AuthAdapter {
  isMockMode = true;

  private async syncServerSession(payload: Record<string, string>): Promise<{ user: UserProfile; expiresAt: number } | null> {
    if (typeof window === "undefined" || process.env.NODE_ENV === "test") return null;
    try {
      const response = await fetch("/api/auth/demo-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  private getActiveUsers(): Record<string, UserProfile & { passwordHash: string }> {
    if (typeof window === "undefined") return DEMO_USERS;
    const stored = localStorage.getItem("ecowatch_mock_users");
    if (!stored) {
      localStorage.setItem("ecowatch_mock_users", JSON.stringify(DEMO_USERS));
      return DEMO_USERS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEMO_USERS;
    }
  }

  private saveActiveUsers(users: Record<string, UserProfile & { passwordHash: string }>) {
    if (typeof window !== "undefined") {
      localStorage.setItem("ecowatch_mock_users", JSON.stringify(users));
    }
  }

  async getSession(): Promise<AuthSession | null> {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
      try {
        const response = await fetch("/api/auth/demo-session", { credentials: "same-origin", cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          return { accessToken: "development-demo-session", expiresAt: data.expiresAt, user: data.user };
        }
        if (response.status === 401) return null;
      } catch {
        // Keep client-only demo state available if the development API is unavailable.
      }
    }
    const raw = getBrowserCookie(SESSION_COOKIE_NAME);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as AuthSession;
      if (session.expiresAt && session.expiresAt < Date.now()) {
        clearBrowserCookie(SESSION_COOKIE_NAME);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const session = await this.getSession();
    return session ? session.user : null;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthResult<AuthSession>> {
    const emailKey = credentials.email.toLowerCase().trim();
    const users = this.getActiveUsers();
    const user = users[emailKey];

    if (!user) {
      return {
        success: false,
        error: "No account found with this email address.",
      };
    }

    if (user.passwordHash !== credentials.password && credentials.password !== "Demo@123") {
      return {
        success: false,
        error: "Incorrect password. (For demo testing, use provided sample credentials or 'Demo@123').",
      };
    }

    const { passwordHash, ...localProfile } = user;
    const serverSession = await this.syncServerSession({ mode: "signin", email: emailKey, password: credentials.password });
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "test" && !serverSession) {
      return { success: false, error: "Enable the signed development demo session to use mock sign-in." };
    }
    const safeProfile = serverSession?.user || localProfile;
    const session: AuthSession = {
      accessToken: `mock_jwt_${safeProfile.id}_${Date.now()}`,
      expiresAt: Date.now() + 7 * 864e5,
      user: safeProfile,
    };

    setBrowserCookie(SESSION_COOKIE_NAME, JSON.stringify(session));

    return {
      success: true,
      data: session,
      message: `Welcome back, ${safeProfile.fullName}`,
    };
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResult<UserProfile>> {
    const emailKey = credentials.email.toLowerCase().trim();
    const users = this.getActiveUsers();

    if (users[emailKey]) {
      return {
        success: false,
        error: "An account with this email address already exists. Please sign in.",
      };
    }

    if (credentials.password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters.",
      };
    }

    // Security Invariant: Public registration is strictly locked to the 'citizen' role.
    let newProfile: UserProfile = {
      id: `usr_citizen_${Date.now()}`,
      email: emailKey,
      fullName: credentials.fullName.trim(),
      role: "citizen",
      createdAt: new Date().toISOString(),
    };

    const serverSession = await this.syncServerSession({ mode: "signup", email: emailKey, fullName: newProfile.fullName });
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "test" && !serverSession) {
      return { success: false, error: "Enable the signed development demo session to use mock sign-up." };
    }
    if (serverSession) newProfile = serverSession.user;

    users[emailKey] = {
      ...newProfile,
      passwordHash: credentials.password,
    };
    this.saveActiveUsers(users);

    const session: AuthSession = {
      accessToken: `mock_jwt_${newProfile.id}_${Date.now()}`,
      expiresAt: Date.now() + 7 * 864e5,
      user: newProfile,
    };
    setBrowserCookie(SESSION_COOKIE_NAME, JSON.stringify(session));

    return {
      success: true,
      data: newProfile,
      message: "Registration successful. Welcome to EcoWatch AI!",
    };
  }

  async signOut(): Promise<AuthResult<null>> {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      } catch {
        // Clear client state even if development API logout is unavailable.
      }
    }
    clearBrowserCookie(SESSION_COOKIE_NAME);
    return {
      success: true,
      data: null,
      message: "Signed out successfully.",
    };
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<AuthResult<null>> {
    const emailKey = request.email.toLowerCase().trim();
    const users = this.getActiveUsers();

    if (!users[emailKey]) {
      // Security best practice: Do not disclose whether an email exists
      return {
        success: true,
        data: null,
        message:
          "If an account exists with this email address, password reset instructions have been simulated.",
      };
    }

    return {
      success: true,
      data: null,
      message: `Password reset simulation: In live mode, a reset link would be dispatched to ${emailKey}.`,
    };
  }

  async updatePassword(request: PasswordUpdateRequest): Promise<AuthResult<null>> {
    if (request.newPassword.length < 8) {
      return {
        success: false,
        error: "New password must be at least 8 characters.",
      };
    }

    const session = await this.getSession();
    if (!session) {
      return {
        success: false,
        error: "You must be signed in to change your password.",
      };
    }

    const users = this.getActiveUsers();
    if (users[session.user.email]) {
      users[session.user.email].passwordHash = request.newPassword;
      this.saveActiveUsers(users);
    }

    return {
      success: true,
      data: null,
      message: "Password updated successfully.",
    };
  }

  async updateProfile(payload: ProfileUpdatePayload): Promise<AuthResult<UserProfile>> {
    const session = await this.getSession();
    if (!session) {
      return {
        success: false,
        error: "You must be signed in to update your profile.",
      };
    }

    const users = this.getActiveUsers();
    const emailKey = session.user.email;
    if (users[emailKey]) {
      users[emailKey].fullName = payload.fullName.trim();
      users[emailKey].updatedAt = new Date().toISOString();
      this.saveActiveUsers(users);
      session.user.fullName = payload.fullName.trim();
      setBrowserCookie(SESSION_COOKIE_NAME, JSON.stringify(session));
    }

    return {
      success: true,
      data: session.user,
      message: "Profile updated successfully.",
    };
  }
}

