"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface AnalysisEntry {
  timestamp: string;
  imageData: string; // data URL
  scores: {
    sizeReduction: number;
    redness: number;
    pus: number;
    infectionRisk: number;
    overallHealing: number;
  };
  explanation?: any;
  notes?: string | null;
}

export default function PatientDashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<AnalysisEntry[]>([]);

  const storageKey = useMemo(() => `wounds:${session?.user?.email || "anon"}`, [session?.user?.email]);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [isPending, session, router]);

  // Enforce basic role separation for demo accounts
  useEffect(() => {
    const role = typeof window !== "undefined" ? localStorage.getItem("demo_role") : null;
    if (role === "doctor") {
      router.push("/doctor");
    }
  }, [router]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const analyze = async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bearer_token")}` },
        body: JSON.stringify({ imageData: preview, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analysis failed");
      const entry: AnalysisEntry = { ...data, imageData: preview, notes };
      const next = [entry, ...history].slice(0, 50);
      setHistory(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotes("");
      setFile(null);
      setPreview(null);
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const overallSeries = history
    .map((h) => ({ x: new Date(h.timestamp).getTime(), y: h.scores.overallHealing }))
    .sort((a, b) => a.x - b.x);

  const minY = Math.min(0.0, ...overallSeries.map((d) => d.y));
  const maxY = Math.max(1.0, ...overallSeries.map((d) => d.y));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patient Dashboard</h1>
        <div className="text-sm text-muted-foreground">{session?.user?.email}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Capture</CardTitle>
          <CardDescription>Use your phone camera to capture today's wound photo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept="image/*" capture="environment" onChange={onFileChange} />
          {preview && (
            <div className="grid sm:grid-cols-2 gap-4">
              <img src={preview} alt="preview" className="w-full h-64 object-cover rounded-md border" />
              <div className="space-y-3">
                <Textarea placeholder="Notes (e.g., pain level, odor)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button onClick={analyze} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Analyzing..." : "Analyze & Save"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Healing Progress</CardTitle>
          <CardDescription>Overall healing score trend (0-1 higher is better)</CardDescription>
        </CardHeader>
        <CardContent>
          {overallSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet. Capture your first photo.</p>) : (
            <Sparkline data={overallSeries} minY={minY} maxY={maxY} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {history.map((h, idx) => (
          <Card key={h.timestamp + idx}>
            <CardHeader>
              <CardTitle className="text-base">{new Date(h.timestamp).toLocaleString()}</CardTitle>
              <CardDescription>Overall: {(h.scores.overallHealing * 100).toFixed(0)}%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <img src={h.imageData} alt={`wound-${idx}`} className="w-full h-48 object-cover rounded-md border" />
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">Size↓: {Math.round(h.scores.sizeReduction * 100)}%</Badge>
                <Badge variant="secondary">Redness: {Math.round(h.scores.redness * 100)}%</Badge>
                <Badge variant="secondary">Pus: {Math.round(h.scores.pus * 100)}%</Badge>
                <Badge variant="destructive">Risk: {Math.round(h.scores.infectionRisk * 100)}%</Badge>
              </div>
              {h.notes && <p className="text-sm text-muted-foreground">Notes: {h.notes}</p>}
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
  const ys = data.map((d) => d.y);
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