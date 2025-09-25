"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();

  const tryDemo = async (role: "patient" | "doctor") => {
    const creds = role === "patient" ? { email: "patient@example.com", password: "Demo123!" } : { email: "doctor@example.com", password: "Demo123!" };
    let { error } = await authClient.signIn.email({
      email: creds.email,
      password: creds.password,
      rememberMe: true,
      callbackURL: role === "doctor" ? "/doctor" : "/patient/dashboard",
    });
    if (error) {
      const res = await authClient.signUp.email({ email: creds.email, name: role === "doctor" ? "Dr. Demo" : "Demo Patient", password: creds.password });
      if (!res.error) {
        await authClient.signIn.email({
          email: creds.email,
          password: creds.password,
          rememberMe: true,
          callbackURL: role === "doctor" ? "/doctor" : "/patient/dashboard",
        });
      }
    }
    localStorage.setItem("demo_role", role);
    router.push(role === "doctor" ? "/doctor" : "/patient/dashboard");
  };

  return (
    <main className="min-h-[80dvh] container mx-auto p-6 grid gap-10">
      <section className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-5">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Digital Wound Monitoring</h1>
          <p className="text-lg text-muted-foreground">Capture daily photos, get AI-assisted analysis, and track healing trends. Built for fast, affordable remote care.</p>
          <div className="flex gap-3">
            <Button onClick={() => tryDemo("patient")}>Try Patient Demo</Button>
            <Button variant="secondary" onClick={() => tryDemo("doctor")}>Try Doctor Demo</Button>
            <Link href="/sign-in" className="inline-flex"><Button variant="ghost">Sign in</Button></Link>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border">
          <img src="https://images.unsplash.com/photo-1512106374987-c3b532ae9f71?q=80&w=1600&auto=format&fit=crop" alt="Healthcare monitoring" className="w-full h-[340px] object-cover" />
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Image Capture</CardTitle>
            <CardDescription>Use any smartphone camera—no extra hardware.</CardDescription>
          </CardHeader>
          <CardContent>
            Daily photos with notes. Metadata is not stored; processing is in-memory for privacy.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
            <CardDescription>Track size, redness, pus, and infection risk.</CardDescription>
          </CardHeader>
          <CardContent>
            Transfer learning ready. This demo uses a mock, explainable pipeline.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remote Care</CardTitle>
            <CardDescription>Doctor portal with timelines and trends.</CardDescription>
          </CardHeader>
          <CardContent>
            Spot early issues and intervene sooner with objective scoring.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}