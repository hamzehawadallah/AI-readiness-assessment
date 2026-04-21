import { useState, useEffect } from "react";
import { authApi, getAdminToken, setAdminToken, clearAdminToken } from "@/lib/apiClient";

interface AuthState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setAuthState({ isAdmin: false, isLoading: false });
      return;
    }
    authApi.check()
      .then(() => setAuthState({ isAdmin: true, isLoading: false }))
      .catch(() => {
        clearAdminToken();
        setAuthState({ isAdmin: false, isLoading: false });
      });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { token } = await authApi.login(password);
      setAdminToken(token);
      setAuthState({ isAdmin: true, isLoading: false });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signOut = async () => {
    try { await authApi.logout(); } catch {}
    clearAdminToken();
    setAuthState({ isAdmin: false, isLoading: false });
    return { error: null };
  };

  // Kept for API compatibility with AdminLogin which passes email + password
  const signUp = async (_email: string, _password: string) => {
    return { error: new Error('Sign-up is not available. Contact your administrator.') };
  };

  return {
    user: authState.isAdmin ? { email: 'admin' } : null,
    session: authState.isAdmin ? {} : null,
    isAdmin: authState.isAdmin,
    isLoading: authState.isLoading,
    signIn,
    signUp,
    signOut,
  };
}
