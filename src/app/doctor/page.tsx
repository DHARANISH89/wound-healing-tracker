"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockPatients = [
  { id: "alice", name: "Alice Patient", latest: "Possible improvement", risk: 0.18 },
  { id: "bob", name: "Bob Rural", latest: "Stable", risk: 0.26 },
  { id: "carol", name: "Carol Chronic", latest: "Watch redness", risk: 0.41 },
];

export default function DoctorHome() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/sign-in");
  }, [isPending, session, router]);

  // Enforce basic role separation for demo accounts
  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("demo_role") : null;
    if (role !== "doctor") {
      router.push("/patient/dashboard");
    }
  }, [router]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Doctor Portal</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockPatients.map((p) => (
          <Link key={p.id} href={`/doctor/${p.id}`}>
            <Card className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <CardDescription>{p.latest}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={p.risk > 0.35 ? "destructive" : "secondary"}>Risk: {Math.round(p.risk * 100)}%</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}