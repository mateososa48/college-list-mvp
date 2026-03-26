const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json";

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

export interface ScorecardSchool {
  id: string;
  name: string;
  city: string;
  state: string;
  school_type: "Public" | "Private";
  acceptance_rate: number | null;
  sat_25th: number | null;
  sat_75th: number | null;
  avg_gpa: number | null;
  test_policy: string | null;
  net_price: number | null;
}

function ownershipToType(ownership: number): "Public" | "Private" {
  return ownership === 1 ? "Public" : "Private";
}

function testRequirementLabel(val: number | null): string | null {
  if (val === null) return null;
  const map: Record<number, string> = {
    1: "Required",
    2: "Recommended",
    3: "Neither Required nor Recommended",
    5: "Considered but not Required",
  };
  return map[val] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapResult(r: any): ScorecardSchool {
  const readingLow = r["latest.admissions.sat_scores.25th_percentile.critical_reading"];
  const readingHigh = r["latest.admissions.sat_scores.75th_percentile.critical_reading"];
  const mathLow = r["latest.admissions.sat_scores.25th_percentile.math"];
  const mathHigh = r["latest.admissions.sat_scores.75th_percentile.math"];

  const sat25 = readingLow && mathLow ? readingLow + mathLow : null;
  const sat75 = readingHigh && mathHigh ? readingHigh + mathHigh : null;

  const netPublic = r["latest.cost.net_price.public.by_income_level.110001_plus"];
  const netPrivate = r["latest.cost.net_price.private.by_income_level.110001_plus"];

  return {
    id: String(r.id),
    name: r["school.name"],
    city: r["school.city"],
    state: r["school.state"],
    school_type: ownershipToType(r["school.ownership"]),
    acceptance_rate: r["latest.admissions.admission_rate.overall"] ?? null,
    sat_25th: sat25,
    sat_75th: sat75,
    avg_gpa: null, // Scorecard doesn't provide GPA — left null
    test_policy: testRequirementLabel(r["latest.admissions.test_requirements"]),
    net_price: netPublic ?? netPrivate ?? null,
  };
}

export async function searchSchools(query: string): Promise<ScorecardSchool[]> {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("COLLEGE_SCORECARD_API_KEY not set");

  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("school.name", query);
  url.searchParams.set("school.degrees_awarded.highest__range", "3,4"); // 4-year universities only
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("_sort", "latest.admissions.admission_rate.overall");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Scorecard API error: ${res.status}`);

  const json = await res.json();
  return (json.results ?? []).map(mapResult);
}

export async function getSchoolById(id: string): Promise<ScorecardSchool | null> {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("COLLEGE_SCORECARD_API_KEY not set");

  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("id", id);
  url.searchParams.set("fields", FIELDS);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const json = await res.json();
  if (!json.results?.length) return null;
  return mapResult(json.results[0]);
}
