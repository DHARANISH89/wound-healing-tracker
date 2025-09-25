"use client";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const catalog: Record<string, { name: string; images: string[] }> = {
  alice: {
    name: "Alice Patient",
    images: [
      "https://images.unsplash.com/photo-1604881987299-9100a873fa9f?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504439468489-c8920d796a29?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  bob: {
    name: "Bob Rural",
    images: [
      "https://images.unsplash.com/photo-1526253038957-bce54e05968d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  carol: {
    name: "Carol Chronic",
    images: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494883759339-0b042055a4ee?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?q=80&w=1200&auto=format&fit=crop",
    ],
  },
};

function analyzeMock(url: string, i: number) {
  // deterministic pseudo-random per URL
  let seed = 0;
  for (let j = 0; j < url.length; j++) seed = (seed * 31 + url.charCodeAt(j)) >>> 0;
  seed ^= i * 2654435761;
  const n = (mod: number) => ((seed = (seed ^ (seed << 13)) ^ (seed >>> 17) ^ (seed << 5)), Math.abs(seed % mod) / mod);
  const sizeReduction = +(0.3 + 0.7 * n(1000)).toFixed(2);
  const redness = +(0.1 + 0.7 * n(1000)).toFixed(2);
  const pus = +(0 + 0.6 * n(1000)).toFixed(2);
  const infectionRisk = +(Math.max(0, Math.min(1, 0.6 * redness + 0.7 * pus - 0.25 * sizeReduction))).toFixed(2);
  const overallHealing = +(Math.max(0, Math.min(1, 0.65 * sizeReduction + 0.2 * (1 - infectionRisk) + 0.15 * (1 - redness)))).toFixed(2);
  return { sizeReduction, redness, pus, infectionRisk, overallHealing };
}

export default function DoctorPatientTimeline() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const data = catalog[id];
  const [series, setSeries] = useState<any[]>([]);

  // Enforce basic role separation for demo accounts
  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("demo_role") : null;
    if (role !== "doctor") {
      router.push("/patient/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (!data) return;
    const s = data.images.map((u, i) => ({
      url: u,
      timestamp: new Date(Date.now() - (data.images.length - i) * 24 * 60 * 60 * 1000).toISOString(),
      scores: analyzeMock(u, i),
    }));
    setSeries(s);
  }, [id]);

  if (!data) return notFound();

  const chartData = series.map((s) => ({ x: new Date(s.timestamp).getTime(), y: s.scores.overallHealing })).sort((a, b) => a.x - b.x);
  const minY = Math.min(0.0, ...chartData.map((d) => d.y));
  const maxY = Math.max(1.0, ...chartData.map((d) => d.y));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{data.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Healing Progress</CardTitle>
          <CardDescription>Overall healing score trend</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? <Sparkline data={chartData} minY={minY} maxY={maxY} /> : <p>Loading...</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {series.map((s, idx) => (
          <Card key={s.timestamp + idx}>
            <CardHeader>
              <CardTitle className="text-base">{new Date(s.timestamp).toLocaleDateString()}</CardTitle>
              <CardDescription>Overall: {Math.round(s.scores.overallHealing * 100)}%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <img src={s.url} alt={`img-${idx}`} className="w-full h-48 object-cover rounded-md border" />
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">Size↓: {Math.round(s.scores.sizeReduction * 100)}%</Badge>
                <Badge variant="secondary">Redness: {Math.round(s.scores.redness * 100)}%</Badge>
                <Badge variant="secondary">Pus: {Math.round(s.scores.pus * 100)}%</Badge>
                <Badge variant={s.scores.infectionRisk > 0.35 ? "destructive" : "secondary"}>Risk: {Math.round(s.scores.infectionRisk * 100)}%</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ data, minY, maxY }: { data: { x: number; y: number }[]; minY: number; maxY: number }) {
  const w = 800, h = 200, pad = 24;
  const xs = data.map((d) => d.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const scaleX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad);
  const scaleY = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - 2 * pad);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${scaleX(d.x)},${scaleY(d.y)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-52">
      <rect x={0} y={0} width={w} height={h} rx={8} className="fill-secondary" />
      <path d={path} className="stroke-primary" fill="none" strokeWidth={3} />
      {data.map((d, i) => (
        <circle key={i} cx={scaleX(d.x)} cy={scaleY(d.y)} r={3.5} className="fill-primary" />
      ))}
    </svg>
  );
}