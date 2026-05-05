"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Helper function to handle active link styling
  const isActive = (path: string) => 
    pathname === path ? "text-primary border-b-2 border-primary" : "text-muted-foreground";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between px-6 lg:px-12">
        
        {/* LOGO - Left Aligned */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-4xl font-black text-primary tracking-tighter italic hover:opacity-80 transition-opacity">
            snackly
          </span>
        </Link>

        {/* DYNAMIC LINKS - Right Aligned */}
        <div className="flex flex-1 items-center justify-end gap-8">
          
          {/* GUEST VIEW */}
          {!user && (
            <>
              <Link 
                href="/login" 
                className="text-sm font-black uppercase tracking-[0.2em] transition-all hover:text-primary"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-primary px-6 py-2.5 rounded font-black text-black italic text-sm uppercase tracking-tight hover:scale-105 transition-transform"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* CUSTOMER VIEW */}
          {user?.role === "customer" && (
            <>
              <Link 
                href="/menu" 
                className={`text-sm font-black uppercase tracking-[0.2em] transition-all hover:text-primary ${isActive("/menu")}`}
              >
                Menu
              </Link>
              <Link 
                href="/orders" 
                className={`text-sm font-black uppercase tracking-[0.2em] transition-all hover:text-primary ${isActive("/orders")}`}
              >
                My Orders
              </Link>
            </>
          )}

          {/* ADMIN VIEW */}
          {user?.role === "admin" && (
            <Link 
              href="/admin" 
              className={`text-sm font-black uppercase tracking-[0.2em] transition-all hover:text-primary ${
                pathname.startsWith("/admin") ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              Admin Panel
            </Link>
          )}

          {/* LOGOUT & USER INFO */}
          {user && (
            <div className="flex items-center gap-6 ml-4 pl-6 border-l border-muted">
              <span className="text-xs font-black uppercase opacity-60">
                {user.username}
              </span>
              <button 
                onClick={logout}
                className="text-xs font-black uppercase tracking-tighter bg-destructive text-destructive-foreground px-4 py-1.5 rounded italic hover:opacity-90 transition-opacity"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}