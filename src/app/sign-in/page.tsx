"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
        callbackURL: "/patient/dashboard",
      });
      if (error) throw error;
      // redirect will occur via callbackURL, but we also push as fallback
      router.push("/patient/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: "patient" | "doctor") => {
    const demo = role === "patient"
      ? { email: "patient@example.com", password: "Demo123!" }
      : { email: "doctor@example.com", password: "Demo123!" };
    setLoading(true);
    setError(null);
    try {
      let { error } = await authClient.signIn.email({
        email: demo.email,
        password: demo.password,
        rememberMe: true,
        callbackURL: role === "doctor" ? "/doctor" : "/patient/dashboard",
      });
      if (error) {
        // Try to register then sign in
        const res = await authClient.signUp.email({
          email: demo.email,
          name: role === "doctor" ? "Dr. Demo" : "Demo Patient",
          password: demo.password,
        });
        if (res.error) throw res.error;
        const again = await authClient.signIn.email({
          email: demo.email,
          password: demo.password,
          rememberMe: true,
          callbackURL: role === "doctor" ? "/doctor" : "/patient/dashboard",
        });
        if (again.error) throw again.error;
      }
      localStorage.setItem("demo_role", role);
      router.push(role === "doctor" ? "/doctor" : "/patient/dashboard");
    } catch (err: any) {
      setError(err?.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80dvh] grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password or try a one-click demo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in..." : "Sign in"}</Button>
          </form>
          <div className="h-px bg-border my-6" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" disabled={loading} onClick={() => demoLogin("patient")}>Demo Patient</Button>
            <Button variant="secondary" disabled={loading} onClick={() => demoLogin("doctor")}>Demo Doctor</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}