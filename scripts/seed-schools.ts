/**
 * seed-schools.ts
 * Fetches school data from College Scorecard and seeds it into Supabase.
 * Covers the top ~200 colleges by reputation.
 *
 * Usage:
 *   npx ts-node --project tsconfig.seed.json scripts/seed-schools.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCORECARD_KEY = process.env.COLLEGE_SCORECARD_API_KEY!;
const BASE_URL = "https://api.data.gov/data/1.0/schools.json";

const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.ownership",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.cost.net_price.public.by_income_level.110001_plus",
  "latest.cost.net_price.private.by_income_level.110001_plus",
  "latest.admissions.test_requirements",
].join(",");

function ownershipToType(v: number): "Public" | "Private" {
  return v === 1 ? "Public" : "Private";
}

function testLabel(v: number | null): string | null {
  if (!v) return null;
  const m: Record<number, string> = {
    1: "Required",
    2: "Recommended",
    3: "Neither Required nor Recommended",
    5: "Considered but not Required",
  };
  return m[v] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSchools(params: Record<string, string>): Promise<any[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", SCORECARD_KEY);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("per_page", "100");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Scorecard error: ${res.status}`);
  const json = await res.json();
  return json.results ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRow(r: any) {
  const rl = r["latest.admissions.sat_scores.25th_percentile.critical_reading"];
  const rh = r["latest.admissions.sat_scores.75th_percentile.critical_reading"];
  const ml = r["latest.admissions.sat_scores.25th_percentile.math"];
  const mh = r["latest.admissions.sat_scores.75th_percentile.math"];

  return {
    id: String(r.id),
    name: r["school.name"],
    city: r["school.city"],
    state: r["school.state"],
    school_type: ownershipToType(r["school.ownership"]),
    acceptance_rate: r["latest.admissions.admission_rate.overall"] ?? null,
    sat_25th: rl && ml ? rl + ml : null,
    sat_75th: rh && mh ? rh + mh : null,
    avg_gpa: null,
    test_policy: testLabel(r["latest.admissions.test_requirements"]),
    net_price:
      r["latest.cost.net_price.public.by_income_level.110001_plus"] ??
      r["latest.cost.net_price.private.by_income_level.110001_plus"] ??
      null,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  console.log("Fetching schools from College Scorecard...");

  // Fetch highly selective schools (acceptance rate < 30%)
  const selective = await fetchSchools({
    "latest.admissions.admission_rate.overall__range": "0,0.3",
    "_sort": "latest.admissions.admission_rate.overall",
  });

  // Fetch moderately selective schools (30-60%)
  const moderate = await fetchSchools({
    "latest.admissions.admission_rate.overall__range": "0.3,0.6",
    "_sort": "latest.admissions.admission_rate.overall",
  });

  const all = [...selective, ...moderate];
  const rows = all.map(toRow);

  console.log(`Fetched ${rows.length} schools. Upserting into Supabase...`);

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("schools").upsert(batch, { onConflict: "id" });
    if (error) console.error(`Batch ${i}-${i + 50} error:`, error.message);
    else console.log(`✓ Batch ${i + 1}–${Math.min(i + 50, rows.length)}`);
  }

  console.log("Done.");
}

main().catch(console.error);
