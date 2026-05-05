"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  username: string;
  role: "admin" | "customer";
  user_id: number; // Removed optional '?' as we need this for logic
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean; // Added to prevent flickering during rehydration
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 1. REHYDRATION: Read cookies when the app first loads
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const session = getCookie("session_active");
    const storedUsername = getCookie("stored_username");
    const storedId = getCookie("stored_user_id");
    const storedRole = getCookie("stored_role");

    if (session === "true" && storedUsername && storedId) {
      setUser({
        username: storedUsername,
        user_id: parseInt(storedId),
        role: (storedRole as "admin" | "customer") || "customer",
      });
    }
    setIsLoading(false);
  }, []);

  // 2. AUTO-REDIRECT: Handle navigation based on auth state
  useEffect(() => {
    if (!isLoading && user && (pathname === "/login" || pathname === "/register")) {
      const destination = user.role === "admin" ? "/admin" : "/menu";
      router.push(destination);
    }
  }, [user, pathname, router, isLoading]);

  const login = (userData: User) => {
    setUser(userData);
    
    // Set cookies so Middleware and Refresh work together
    const expires = "; max-age=3600; path=/; SameSite=Lax";
    document.cookie = `session_active=true${expires}`;
    document.cookie = `stored_username=${userData.username}${expires}`;
    document.cookie = `stored_user_id=${userData.user_id}${expires}`;
    document.cookie = `stored_role=${userData.role}${expires}`;
  };

  const logout = () => {
    setUser(null);
    
    // Clear all cookies
    const expireNow = "; max-age=0; path=/";
    document.cookie = `session_active=false${expireNow}`;
    document.cookie = `stored_username=${expireNow}`;
    document.cookie = `stored_user_id=${expireNow}`;
    document.cookie = `stored_role=${expireNow}`;
    
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {/* Optional: Add a small loading spinner here if isLoading is true */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};