import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const admin = createAdminClient();

const SCHOOL_COLUMNS =
  "id, name, city, state, school_type, setting, enrollment, acceptance_rate, sat_25th, sat_75th, avg_gpa, test_policy, net_price, tuition_in_state, tuition_out_of_state, grad_rate, median_earnings, website_url, latitude, longitude";

const STATE_LIMIT = 4;
const STATS_LIMIT = 4;
const EXPLORE_LIMIT = 3;

interface SchoolRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  school_type: string | null;
  setting: string | null;
  enrollment: number | null;
  acceptance_rate: number | null;
  sat_25th: number | null;
  sat_75th: number | null;
  avg_gpa: number | null;
  test_policy: string | null;
  net_price: number | null;
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  grad_rate: number | null;
  median_earnings: number | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface ProfileRow {
  gpa: number | null;
  sat_score: number | null;
  act_score: number | null;
}

interface SuggestionCategory {
  id: "state_match" | "stats_match" | "explore_new";
  label: string;
  emoji: string;
  schools: SchoolRow[];
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "Washington D.C.",
};

function estimateSatFromAct(act: number | null): number | null {
  if (act === null) return null;
  const concordance = [
    [36, 1570], [35, 1540], [34, 1510], [33, 1480], [32, 1450], [31, 1420],
    [30, 1390], [29, 1360], [28, 1320], [27, 1290], [26, 1260], [25, 1220],
    [24, 1180], [23, 1140], [22, 1110], [21, 1080], [20, 1040],
  ] as const;
  for (const [actScore, satScore] of concordance) {
    if (act >= actScore) return satScore;
  }
  return 1000;
}

function satToAcceptanceRange(sat: number): [number, number] {
  if (sat >= 1500) return [0.03, 0.30];
  if (sat >= 1300) return [0.12, 0.55];
  if (sat >= 1100) return [0.25, 0.75];
  return [0.40, 1.0];
}

function gpaToAcceptanceRange(gpa: number): [number, number] {
  if (gpa >= 3.8) return [0.05, 0.40];
  if (gpa >= 3.5) return [0.15, 0.60];
  if (gpa >= 3.0) return [0.30, 0.80];
  return [0.45, 1.0];
}

function applyExclusion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  excludedIds: Set<string>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (excludedIds.size === 0) return query;
  return query.not("id", "in", `(${[...excludedIds].join(",")})`);
}

async function fetchStateCategory(
  dominantState: string,
  excludedIds: Set<string>,
  sat: number | null,
  gpa: number | null,
  skip: number
): Promise<SchoolRow[]> {
  // Derive acceptance rate range from stats so we don't show wildly mismatched schools
  let range: [number, number] | null = null;
  if (sat !== null) range = satToAcceptanceRange(sat);
  else if (gpa !== null) range = gpaToAcceptanceRange(gpa);

  let q = admin
    .from("schools")
    .select(SCHOOL_COLUMNS)
    .eq("state", dominantState);

  if (range) {
    // Widen by 10pp on each side to avoid being too restrictive within a state
    q = q.gte("acceptance_rate", Math.max(0, range[0] - 0.1))
         .lte("acceptance_rate", Math.min(1, range[1] + 0.1));
  }

  q = applyExclusion(q, excludedIds);
  q = q.order("enrollment", { ascending: false, nullsFirst: false })
       .range(skip, skip + STATE_LIMIT - 1);

  const { data } = await q;
  return (data as SchoolRow[] | null) ?? [];
}

async function fetchStatsCategory(
  sat: number | null,
  gpa: number | null,
  excludedIds: Set<string>,
  skip: number
): Promise<{ schools: SchoolRow[]; hasStats: boolean }> {
  let range: [number, number] | null = null;
  if (sat !== null) range = satToAcceptanceRange(sat);
  else if (gpa !== null) range = gpaToAcceptanceRange(gpa);

  let q = admin.from("schools").select(SCHOOL_COLUMNS);

  if (range) {
    q = q.gte("acceptance_rate", range[0]).lte("acceptance_rate", range[1]);
  } else {
    q = q.gte("acceptance_rate", 0.15).lte("acceptance_rate", 0.60);
  }

  q = applyExclusion(q, excludedIds);
  q = q.order("grad_rate", { ascending: false, nullsFirst: false })
       .range(skip, skip + STATS_LIMIT - 1);

  const { data } = await q;
  return { schools: (data as SchoolRow[] | null) ?? [], hasStats: range !== null };
}

async function fetchExploreCategory(
  dominantState: string | null,
  excludedIds: Set<string>,
  skip: number
): Promise<SchoolRow[]> {
  let q = admin
    .from("schools")
    .select(SCHOOL_COLUMNS)
    .gte("grad_rate", 0.65);

  if (dominantState) q = q.neq("state", dominantState);

  q = applyExclusion(q, excludedIds);
  q = q.order("enrollment", { ascending: false, nullsFirst: false })
       .range(skip, skip + EXPLORE_LIMIT - 1);

  const { data } = await q;
  return (data as SchoolRow[] | null) ?? [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listParam = searchParams.get("list") ?? "";
    const excludedIds = new Set<string>(listParam ? listParam.split(",").filter(Boolean) : []);
    const reloadCategory = searchParams.get("category") as SuggestionCategory["id"] | null;
    const reloadSkip = parseInt(searchParams.get("skip") ?? "0", 10);

    // Get auth user and profile
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile: ProfileRow | null = null;
    let listSchools: SchoolRow[] = [];

    if (user) {
      const [profileResult, listResult] = await Promise.all([
        admin
          .from("profiles")
          .select("gpa, sat_score, act_score")
          .eq("id", user.id)
          .single(),
        excludedIds.size > 0
          ? admin
              .from("user_schools")
              .select(`school_id, schools:schools!inner(${SCHOOL_COLUMNS})`)
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      profile = profileResult.data as ProfileRow | null;

      if (listResult.data) {
        for (const row of listResult.data as { school_id: string; schools: SchoolRow | SchoolRow[] | null }[]) {
          const s = Array.isArray(row.schools) ? row.schools[0] : row.schools;
          if (s) listSchools.push(s);
        }
      }
    }

    // Derive dominant state
    const stateCounts = new Map<string, number>();
    for (const s of listSchools) {
      if (s.state) stateCounts.set(s.state, (stateCounts.get(s.state) ?? 0) + 1);
    }
    let dominantState: string | null = null;
    let maxCount = 0;
    for (const [state, count] of stateCounts) {
      if (count > maxCount) { maxCount = count; dominantState = state; }
    }

    const effectiveSat = profile?.sat_score ?? estimateSatFromAct(profile?.act_score ?? null);

    // Single-category reload path
    if (reloadCategory) {
      let result: SuggestionCategory | null = null;

      if (reloadCategory === "state_match" && dominantState) {
        const schools = await fetchStateCategory(dominantState, excludedIds, effectiveSat, profile?.gpa ?? null, reloadSkip);
        if (schools.length > 0) {
          result = {
            id: "state_match",
            label: `More in ${STATE_NAMES[dominantState] ?? dominantState}`,
            emoji: "📍",
            schools,
          };
        }
      } else if (reloadCategory === "stats_match") {
        const statsResult = await fetchStatsCategory(effectiveSat, profile?.gpa ?? null, excludedIds, reloadSkip);
        if (statsResult.schools.length > 0) {
          result = {
            id: "stats_match",
            label: statsResult.hasStats ? "Matches your stats" : "Top schools to consider",
            emoji: "🎯",
            schools: statsResult.schools,
          };
        }
      } else if (reloadCategory === "explore_new") {
        const schools = await fetchExploreCategory(dominantState, excludedIds, reloadSkip);
        if (schools.length > 0) {
          result = { id: "explore_new", label: "Worth a look", emoji: "✨", schools };
        }
      }

      return NextResponse.json({ categories: result ? [result] : [] });
    }

    // Full load path — all three categories in parallel
    const [stateSchools, statsResult, exploreSchools] = await Promise.all([
      dominantState ? fetchStateCategory(dominantState, excludedIds, effectiveSat, profile?.gpa ?? null, 0) : Promise.resolve([]),
      fetchStatsCategory(effectiveSat, profile?.gpa ?? null, excludedIds, 0),
      fetchExploreCategory(dominantState, excludedIds, 0),
    ]);

    // Deduplicate across categories
    const seenIds = new Set<string>();
    function dedup(schools: SchoolRow[]): SchoolRow[] {
      return schools.filter(s => {
        if (seenIds.has(s.id)) return false;
        seenIds.add(s.id);
        return true;
      });
    }

    const categories: SuggestionCategory[] = [];

    const dedupedState = dedup(stateSchools);
    if (dedupedState.length > 0 && dominantState) {
      categories.push({
        id: "state_match",
        label: `More in ${STATE_NAMES[dominantState] ?? dominantState}`,
        emoji: "📍",
        schools: dedupedState,
      });
    }

    const dedupedStats = dedup(statsResult.schools);
    if (dedupedStats.length > 0) {
      categories.push({
        id: "stats_match",
        label: statsResult.hasStats ? "Matches your stats" : "Top schools to consider",
        emoji: "🎯",
        schools: dedupedStats,
      });
    }

    const dedupedExplore = dedup(exploreSchools);
    if (dedupedExplore.length > 0) {
      categories.push({
        id: "explore_new",
        label: "Worth a look",
        emoji: "✨",
        schools: dedupedExplore,
      });
    }

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Suggested schools error:", err);
    return NextResponse.json({ categories: [] });
  }
}
