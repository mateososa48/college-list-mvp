const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools.json";

const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.ownership",
  "school.locale",
  "school.school_url",
  "latest.student.size",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.cost.net_price.public.by_income_level.110001_plus",
  "latest.cost.net_price.private.by_income_level.110001_plus",
  "latest.cost.tuition.out_of_state",
  "latest.cost.tuition.in_state",
  "latest.admissions.test_requirements",
  "latest.completion.completion_rate_4yr_150nt",
  "latest.earnings.10_yrs_after_entry.median",
].join(",");

export interface ScorecardSchool {
  id: string;
  name: string;
  city: string;
  state: string;
  school_type: "Public" | "Private";
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
}

function ownershipToType(ownership: number): "Public" | "Private" {
  return ownership === 1 ? "Public" : "Private";
}

function localeToSetting(locale: number | null): string | null {
  if (locale === null || locale === undefined) return null;
  if (locale === 11) return "Large City";
  if (locale === 12) return "Mid-Size City";
  if (locale === 13) return "Small City";
  if (locale === 21) return "Large Suburb";
  if (locale === 22) return "Mid-Size Suburb";
  if (locale === 23) return "Small Suburb";
  if (locale >= 31 && locale <= 33) return "Town";
  if (locale >= 41 && locale <= 43) return "Rural";
  return null;
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

function parseDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const full = url.startsWith("http") ? url : `https://${url}`;
    return new URL(full).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
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

  const rawUrl = r["school.school_url"] ?? null;
  const domain = parseDomain(rawUrl);

  return {
    id: String(r.id),
    name: r["school.name"],
    city: r["school.city"],
    state: r["school.state"],
    school_type: ownershipToType(r["school.ownership"]),
    setting: localeToSetting(r["school.locale"] ?? null),
    enrollment: r["latest.student.size"] ?? null,
    acceptance_rate: r["latest.admissions.admission_rate.overall"] ?? null,
    sat_25th: sat25,
    sat_75th: sat75,
    avg_gpa: null,
    test_policy: testRequirementLabel(r["latest.admissions.test_requirements"]),
    net_price: netPublic ?? netPrivate ?? null,
    tuition_in_state: r["latest.cost.tuition.in_state"] ?? null,
    tuition_out_of_state: r["latest.cost.tuition.out_of_state"] ?? null,
    grad_rate: r["latest.completion.completion_rate_4yr_150nt"] ?? null,
    median_earnings: r["latest.earnings.10_yrs_after_entry.median"] ?? null,
    website_url: domain,
  };
}

export async function searchSchools(query: string): Promise<ScorecardSchool[]> {
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) throw new Error("COLLEGE_SCORECARD_API_KEY not set");

  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("school.name", query);
  url.searchParams.set("school.degrees_awarded.highest__range", "3,4");
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("_sort", "latest.admissions.admission_rate.overall");

  const res = await fetch(url.toString(), { cache: "no-store" });
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
