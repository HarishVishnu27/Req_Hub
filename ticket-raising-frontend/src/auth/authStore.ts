const KEY = "fastest_auth";

export type UserProfile = {
  email: string;
  first_name: string;
  last_name: string;
  email_hash: string;
  is_admin: boolean;
};

export type AuthState = {
  token: string;
  user?: UserProfile;
};

export function getAuth(): AuthState | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function setAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function setUserProfile(user: UserProfile) {
  const existing = getAuth();
  if (!existing?.token) return;
  setAuth({ token: existing.token, user });
}