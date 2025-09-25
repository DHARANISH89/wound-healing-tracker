import { NextRequest, NextResponse } from "next/server";

// Mock AI analysis route - no image is stored, processing is in-memory only
export async function POST(req: NextRequest) {
  try {
    const { imageData, notes } = await req.json();
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json({ error: "imageData (base64) required" }, { status: 400 });
    }

    // Basic privacy: do not persist image or metadata; strip data URL header if present
    const base64 = imageData.split(",").pop() as string;

    // Derive pseudo-deterministic numbers from the image content to keep results stable per image
    let seed = 0;
    for (let i = 0; i < Math.min(500, base64.length); i++) seed = (seed * 31 + base64.charCodeAt(i)) >>> 0;
    const rnd = (min: number, max: number) => {
      // xorshift-like pseudo RNG from seed
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      const n = Math.abs(seed % 1000) / 1000;
      return +(min + (max - min) * n).toFixed(2);
    };

    // Mock features (0-1): lower redness/pus => better; sizeReduction closer to 1 => better
    const sizeReduction = rnd(0.2, 0.95);
    const redness = rnd(0.05, 0.85);
    const pus = rnd(0.0, 0.6);
    // Infection risk combines redness and pus, reduced by size reduction
    const infectionRisk = Math.max(0, Math.min(1, +(0.6 * redness + 0.7 * pus - 0.3 * sizeReduction))).toFixed(2);
    const overallHealing = Math.max(0, Math.min(1, +(0.6 * sizeReduction + 0.2 * (1 - parseFloat(infectionRisk)) + 0.2 * (1 - redness)))).toFixed(2);

    const result = {
      timestamp: new Date().toISOString(),
      scores: {
        sizeReduction: +sizeReduction.toFixed(2),
        redness: +redness.toFixed(2),
        pus: +pus.toFixed(2),
        infectionRisk: parseFloat(infectionRisk),
        overallHealing: parseFloat(overallHealing),
      },
      explanation: {
        summary: "Mock AI analysis using deterministic randomness for POC.",
        notes: notes || null,
        factors: [
          "Edges detection approximated to infer wound area change",
          "Red channel intensity proxy for erythema (redness)",
          "Yellow/green saturation proxy for exudate (pus)",
          "Composite risk blends redness + pus minus size reduction"
        ]
      }
    };

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}