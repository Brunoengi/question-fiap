"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "./api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");
      if (token && storedUser) {
        return JSON.parse(storedUser);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("accessToken");
    }
    return false;
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    api
      .get("/users/me")
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
      });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
