export type UserRole = "citizen" | "municipal_officer" | "administrator";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  ward?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: UserProfile;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  // Notice: role is omitted to enforce server-side binding to 'citizen'
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateRequest {
  newPassword: string;
  token?: string;
}

export interface ProfileUpdatePayload {
  fullName: string;
}

export interface AuthResult<T = UserProfile> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthAdapter {
  isMockMode: boolean;
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<UserProfile | null>;
  signIn(credentials: SignInCredentials): Promise<AuthResult<AuthSession>>;
  signUp(credentials: SignUpCredentials): Promise<AuthResult<UserProfile>>;
  signOut(): Promise<AuthResult<null>>;
  requestPasswordReset(request: PasswordResetRequest): Promise<AuthResult<null>>;
  updatePassword(request: PasswordUpdateRequest): Promise<AuthResult<null>>;
  updateProfile(payload: ProfileUpdatePayload): Promise<AuthResult<UserProfile>>;
}

