"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        document.cookie = "session_active=true; path=/; max-age=3600"; // Expires in 1 hour
        login(data.user); // Only stored in memory now
      } else {
        setError(data.error || "Access Denied");
      }
    } catch (err) {
      setError("System Offline");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 font-mono">
      <Card className="w-full max-w-[350px] shadow-2xl border-2 border-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-black italic tracking-tighter text-primary">LOGIN</CardTitle>
          <CardDescription className="text-[10px] font-black uppercase opacity-60 tracking-widest">Enter your credentials</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 p-2 rounded text-[10px] font-bold uppercase text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-70">Username</Label>
              <Input placeholder="estuti" required onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-70">Password</Label>
              <Input type="password" required onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-black italic uppercase">Enter</Button>
            <Link href="/register" className="text-[10px] font-bold uppercase text-primary hover:underline">New Here? Register</Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}