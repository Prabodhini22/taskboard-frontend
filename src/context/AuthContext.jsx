import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "taskboard_token";
const USER_KEY = "taskboard_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const persistSession = useCallback((authResponse) => {
    localStorage.setItem(TOKEN_KEY, authResponse.token);
    const userInfo = {
      id: authResponse.userId,
      name: authResponse.name,
      email: authResponse.email,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await api.login({ email, password });
      persistSession(res);
    },
    [persistSession]
  );

  const signup = useCallback(
    async (name, email, password) => {
      const res = await api.signup({ name, email, password });
      persistSession(res);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
