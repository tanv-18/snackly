"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Register() {
  const [formData, setFormData] = useState({ username: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Server connection lost.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-mono">
      <Card className="w-full max-w-[350px] shadow-2xl border-2 border-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black italic tracking-tighter text-primary">JOIN SNACKLY</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase opacity-60 tracking-widest">
            {isSuccess ? "Redirecting..." : "Create your credentials"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* INLINE ERROR UX */}
            {error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 p-2 rounded text-[10px] font-bold uppercase text-center">
                {error}
              </div>
            )}
            {/* INLINE SUCCESS UX */}
            {isSuccess && (
              <div className="bg-green-500/10 text-green-500 border border-green-500/20 p-2 rounded text-[10px] font-bold uppercase text-center animate-pulse">
                Registration Successful!
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-70">Username</Label>
              <Input required onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-70">Password</Label>
              <Input type="password" required onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-70">Account Type</Label>
              <Select defaultValue="customer" onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" disabled={isSuccess} className="w-full font-black italic uppercase">Initialize</Button>
            <Link href="/login" className="text-[10px] font-bold uppercase text-primary hover:underline">Existing Member? Login</Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}