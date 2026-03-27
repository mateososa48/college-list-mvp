/**
 * import-essay-json.ts
 *
 * Imports essay prompts from JSON into Supabase, including rich layout metadata.
 *
 * Supported input:
 * - Flat rows: school_name, prompt_text, word_limit, notes
 * - Rich rows: optional application_type, essay_count_summary, word_limit_summary,
 *   display_title, section_key, section_title, section_order, prompt_order, prompt_title
 *
 * Usage:
 *   npx ts-node --project tsconfig.seed.json scripts/import-essay-json.ts ./data/essays.json
 *   npx ts-node --project tsconfig.seed.json scripts/import-essay-json.ts ./data/essays.json --dry-run
 *   npx ts-node --project tsconfig.seed.json scripts/import-essay-json.ts ./data/essays.json --replace
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

interface JsonEssayRow {
  school_name: string;
  prompt_text: string;
  word_limit: number | null;
  notes?: string | null;
  application_type?: string | null;
  essay_count_summary?: string | null;
  word_limit_summary?: string | null;
  display_title?: string | null;
  section_key?: string | null;
  section_title?: string | null;
  section_order?: number | null;
  prompt_order?: number | null;
  prompt_title?: string | null;
}

interface SchoolRow {
  id: string;
  name: string;
}

interface EssayPromptInsertRow {
  school_id: string;
  prompt_text: string;
  word_limit: number | null;
  section_key: string | null;
  section_title: string | null;
  section_order: number | null;
  prompt_order: number | null;
  prompt_title: string | null;
}

interface EssayRequirementSummaryInsertRow {
  school_id: string;
  display_title: string;
  application_type: string | null;
  essay_count_summary: string | null;
  word_limit_summary: string | null;
}

interface ScorecardResult {
  id: string | number;
  "school.name": string;
  "school.city": string | null;
  "school.state": string | null;
  "school.ownership": number | null;
}

interface DerivedSection {
  key: string;
  title: string;
  order: number;
  prompts: EssayPromptInsertRow[];
  limitLabel: string | null;
}

interface DerivedSchoolPayload {
  school: SchoolRow;
  summary: EssayRequirementSummaryInsertRow;
  prompts: EssayPromptInsertRow[];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const scorecardApiKey = process.env.COLLEGE_SCORECARD_API_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const SCHOOL_NAME_OVERRIDES: Record<string, string> = {
  mit: "Massachusetts Institute of Technology",
  "columbia university": "Columbia University in the City of New York",
  "georgia institute of technology": "Georgia Institute of Technology-Main Campus",
  "washington university in st louis": "Washington University in St Louis",
  "tulane university": "Tulane University of Louisiana",
};

const APPLICATION_TYPE_OVERRIDES: Record<string, string> = {
  "stanford university": "Common Application",
  "massachusetts institute of technology": "MyMIT Application",
  "georgetown university": "Georgetown Application",
  "university of california los angeles": "UC Application",
  "university of california berkeley": "UC Application",
};

const PROMPT_TITLE_OVERRIDES: Record<string, Record<string, string>> = {
  "stanford university": {
    [normalizePromptText("The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.")]:
      "Essay 1: Intellectual Curiosity",
    [normalizePromptText("Virtually all of Stanford's undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate — and us — get to know you better.")]:
      "Essay 2: Roommate Essay",
    [normalizePromptText("Please describe what aspects of your life experiences, interests and character would help you make a distinctive contribution to Stanford University.")]:
      "Essay 3: What Makes You Distinctive",
  },
};

const MISFILED_PROMPT_CLEANUPS = [
  {
    targetSchoolName: "Massachusetts Institute of Technology",
    mistakenSchoolName: "Mitchell College",
  },
];

function usageAndExit(message?: string): never {
  if (message) console.error(message);
  console.error(
    "Usage: npx ts-node --project tsconfig.seed.json scripts/import-essay-json.ts <json-file> [--dry-run] [--replace]"
  );
  process.exit(1);
}

function normalizeSchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.,'()/-]/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePromptText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function acronymForSchool(name: string): string {
  const stopWords = new Set(["the", "of", "at", "and", "for"]);

  return name
    .toLowerCase()
    .replace(/[.,'()/-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word))
    .map((word) => word[0])
    .join("");
}

function resolveSchoolLookupName(name: string): string {
  const normalized = normalizeSchoolName(name);
  return SCHOOL_NAME_OVERRIDES[normalized] ?? name;
}

function loadInputRows(filePath: string): JsonEssayRow[] {
  const fullPath = path.resolve(filePath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("JSON file must contain an array of prompt rows");
  }

  const rows = parsed as JsonEssayRow[];

  rows.forEach((row, index) => {
    if (!row?.school_name?.trim()) {
      throw new Error(`Row ${index + 1} is missing school_name`);
    }
    if (!row?.prompt_text?.trim()) {
      throw new Error(`Row ${index + 1} is missing prompt_text`);
    }
    if (
      row.word_limit !== null &&
      row.word_limit !== undefined &&
      typeof row.word_limit !== "number"
    ) {
      throw new Error(`Row ${index + 1} has a non-numeric word_limit`);
    }
  });

  return rows;
}

async function fetchSchools(): Promise<SchoolRow[]> {
  const { data, error } = await supabase.from("schools").select("id, name");

  if (error) {
    throw new Error(`Failed to load schools: ${error.message}`);
  }

  return (data ?? []) as SchoolRow[];
}

function buildSchoolLookup(schools: SchoolRow[]): Map<string, SchoolRow[]> {
  const lookup = new Map<string, SchoolRow[]>();

  for (const school of schools) {
    const key = normalizeSchoolName(school.name);
    const existing = lookup.get(key) ?? [];
    existing.push(school);
    lookup.set(key, existing);
  }

  return lookup;
}

function pickSchoolMatch(
  schoolName: string,
  lookup: Map<string, SchoolRow[]>
): SchoolRow | null {
  const lookupName = resolveSchoolLookupName(schoolName);
  const normalized = normalizeSchoolName(lookupName);
  const candidates = lookup.get(normalized);

  if (!candidates?.length) return null;

  const exactCaseInsensitive = candidates.find(
    (school) => school.name.toLowerCase() === lookupName.toLowerCase()
  );

  return exactCaseInsensitive ?? candidates[0] ?? null;
}

function ownershipToType(ownership: number | null): "Public" | "Private" | null {
  if (ownership === 1) return "Public";
  if (ownership === 2 || ownership === 3) return "Private";
  return null;
}

function scoreScorecardMatch(query: string, candidateName: string): number {
  const resolvedQuery = resolveSchoolLookupName(query);
  const normalizedQuery = normalizeSchoolName(resolvedQuery);
  const normalizedCandidate = normalizeSchoolName(candidateName);

  if (normalizedQuery === normalizedCandidate) return 100;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 90;
  if (normalizedCandidate.includes(normalizedQuery)) return 80;

  const queryAcronym = acronymForSchool(resolvedQuery);
  const candidateAcronym = acronymForSchool(candidateName);
  if (queryAcronym && queryAcronym === candidateAcronym) return 70;

  const queryWords = new Set(normalizedQuery.split(" "));
  const candidateWords = new Set(normalizedCandidate.split(" "));
  let sharedWords = 0;

  for (const word of Array.from(queryWords)) {
    if (candidateWords.has(word)) sharedWords += 1;
  }

  return sharedWords;
}

async function searchScorecardSchoolByName(schoolName: string): Promise<SchoolRow | null> {
  if (!scorecardApiKey) return null;

  const resolvedName = resolveSchoolLookupName(schoolName);
  const url = new URL("https://api.data.gov/ed/collegescorecard/v1/schools.json");
  url.searchParams.set("api_key", scorecardApiKey);
  url.searchParams.set("school.name", resolvedName);
  url.searchParams.set("school.degrees_awarded.highest__range", "3,4");
  url.searchParams.set(
    "fields",
    "id,school.name,school.city,school.state,school.ownership"
  );
  url.searchParams.set("per_page", "10");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Scorecard lookup failed for ${schoolName}: ${response.status}`);
  }

  const json = (await response.json()) as { results?: ScorecardResult[] };
  const results = json.results ?? [];
  if (results.length === 0) return null;

  const bestMatch = results
    .map((result) => ({
      result,
      score: scoreScorecardMatch(schoolName, result["school.name"]),
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (!bestMatch || bestMatch.score === 0) return null;

  const school = {
    id: String(bestMatch.result.id),
    name: bestMatch.result["school.name"],
  };

  const { error } = await supabase.from("schools").upsert(
    {
      id: school.id,
      name: school.name,
      city: bestMatch.result["school.city"],
      state: bestMatch.result["school.state"],
      school_type: ownershipToType(bestMatch.result["school.ownership"]),
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(`Failed to upsert ${school.name} from Scorecard: ${error.message}`);
  }

  return school;
}

function extractWordLimitLabel(row: JsonEssayRow): string | null {
  const notes = row.notes ?? "";
  const rangeMatch = notes.match(/(\d+)\s*[–-]\s*(\d+)\s*words?/i);
  if (rangeMatch) {
    return `${rangeMatch[1]}–${rangeMatch[2]} words each`;
  }

  const directWordMatch = notes.match(/(\d+)\s*words?/i);
  if (directWordMatch) {
    return `${directWordMatch[1]} words each`;
  }

  if (row.word_limit !== null && row.word_limit !== undefined) {
    return `${row.word_limit} words each`;
  }

  return null;
}

function inferSectionKey(row: JsonEssayRow): string {
  const notes = (row.notes ?? "").toLowerCase();

  if (
    notes.includes("short answer") ||
    notes.includes("short take") ||
    notes.includes("short question") ||
    (row.word_limit !== null && row.word_limit <= 60)
  ) {
    return "short_questions";
  }

  if (notes.includes("essay") || (row.word_limit !== null && row.word_limit >= 100)) {
    return "essay_prompts";
  }

  return "additional_prompts";
}

function defaultSectionOrder(sectionKey: string): number {
  if (sectionKey === "short_questions") return 1;
  if (sectionKey === "essay_prompts") return 2;
  return 3;
}

function deriveSectionLimitLabel(rows: JsonEssayRow[]): string | null {
  const labels = rows
    .map((row) => extractWordLimitLabel(row))
    .filter((label): label is string => !!label);

  const uniqueLabels = Array.from(new Set(labels));
  if (uniqueLabels.length === 1) return uniqueLabels[0];
  return null;
}

function deriveSectionTitle(
  sectionKey: string,
  rows: JsonEssayRow[],
  explicitTitle?: string | null
): string {
  if (explicitTitle?.trim()) return explicitTitle.trim();

  const limitLabel = deriveSectionLimitLabel(rows);

  if (sectionKey === "short_questions") {
    return limitLabel ? `Short Questions (${limitLabel})` : "Short Questions";
  }

  if (sectionKey === "essay_prompts") {
    return limitLabel ? `Essay Prompts (${limitLabel})` : "Essay Prompts";
  }

  return "Additional Prompts";
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function deriveEssayCountSummary(sections: DerivedSection[]): string | null {
  const parts: string[] = [];

  sections.forEach((section) => {
    const count = section.prompts.length;
    if (count === 0) return;

    if (section.key === "short_questions") {
      parts.push(
        `${count} ${pluralize(count, "short question", "short questions")}${section.limitLabel ? ` (${section.limitLabel})` : ""}`
      );
      return;
    }

    if (section.key === "essay_prompts") {
      parts.push(
        `${count} ${pluralize(count, "essay", "essays")}${section.limitLabel ? ` (${section.limitLabel})` : ""}`
      );
      return;
    }

    parts.push(
      `${count} ${pluralize(count, "additional prompt", "additional prompts")}${section.limitLabel ? ` (${section.limitLabel})` : ""}`
    );
  });

  return parts.length > 0 ? parts.join(" + ") : null;
}

function deriveWordLimitSummary(sections: DerivedSection[]): string | null {
  const parts: string[] = [];

  sections.forEach((section) => {
    if (!section.limitLabel) return;

    if (section.key === "short_questions") {
      parts.push(`${section.limitLabel.replace(" each", "")} for short questions`);
      return;
    }

    if (section.key === "essay_prompts") {
      parts.push(`${section.limitLabel.replace(" each", "")} for essays`);
      return;
    }

    parts.push(`${section.limitLabel.replace(" each", "")} for additional prompts`);
  });

  return parts.length > 0 ? parts.join(", ") : null;
}

function derivePromptTitle(schoolName: string, row: JsonEssayRow): string | null {
  if (row.prompt_title?.trim()) return row.prompt_title.trim();

  const schoolTitles = PROMPT_TITLE_OVERRIDES[normalizeSchoolName(schoolName)];
  if (!schoolTitles) return null;

  return schoolTitles[normalizePromptText(row.prompt_text)] ?? null;
}

function dedupePrompts(prompts: EssayPromptInsertRow[]): EssayPromptInsertRow[] {
  const seen = new Set<string>();
  const deduped: EssayPromptInsertRow[] = [];

  prompts.forEach((prompt) => {
    const key = `${prompt.school_id}::${normalizePromptText(prompt.prompt_text)}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push({
      ...prompt,
      prompt_text: normalizePromptText(prompt.prompt_text),
    });
  });

  return deduped;
}

function deriveSchoolPayload(
  school: SchoolRow,
  rows: JsonEssayRow[]
): DerivedSchoolPayload {
  const groupedRows = new Map<string, JsonEssayRow[]>();

  rows.forEach((row) => {
    const sectionKey = row.section_key ?? inferSectionKey(row);
    const existing = groupedRows.get(sectionKey) ?? [];
    existing.push(row);
    groupedRows.set(sectionKey, existing);
  });

  const sections = Array.from(groupedRows.entries())
    .map(([sectionKey, sectionRows]) => {
      const sectionOrder =
        sectionRows.find((row) => row.section_order !== null && row.section_order !== undefined)?.section_order ??
        defaultSectionOrder(sectionKey);
      const sectionTitle = deriveSectionTitle(
        sectionKey,
        sectionRows,
        sectionRows.find((row) => row.section_title)?.section_title
      );

      const prompts = sectionRows.map((row, index) => ({
        school_id: school.id,
        prompt_text: row.prompt_text,
        word_limit: row.word_limit ?? null,
        section_key: sectionKey,
        section_title: sectionTitle,
        section_order: sectionOrder,
        prompt_order:
          row.prompt_order !== null && row.prompt_order !== undefined
            ? row.prompt_order
            : index + 1,
        prompt_title: derivePromptTitle(school.name, row),
      }));

      return {
        key: sectionKey,
        title: sectionTitle,
        order: sectionOrder,
        prompts,
        limitLabel: deriveSectionLimitLabel(sectionRows),
      };
    })
    .sort((a, b) => a.order - b.order);

  const prompts = dedupePrompts(
    sections.flatMap((section) =>
      section.prompts.sort(
        (a, b) => (a.prompt_order ?? 0) - (b.prompt_order ?? 0)
      )
    )
  );

  const firstRow = rows[0];
  const explicitApplicationType = rows.find((row) => row.application_type)?.application_type ?? null;
  const explicitEssayCountSummary = rows.find((row) => row.essay_count_summary)?.essay_count_summary ?? null;
  const explicitWordLimitSummary = rows.find((row) => row.word_limit_summary)?.word_limit_summary ?? null;
  const explicitDisplayTitle = rows.find((row) => row.display_title)?.display_title ?? null;

  const summary: EssayRequirementSummaryInsertRow = {
    school_id: school.id,
    display_title: explicitDisplayTitle?.trim() || "Essay Requirements",
    application_type:
      explicitApplicationType?.trim() ||
      APPLICATION_TYPE_OVERRIDES[normalizeSchoolName(school.name)] ||
      null,
    essay_count_summary:
      explicitEssayCountSummary?.trim() || deriveEssayCountSummary(sections),
    word_limit_summary:
      explicitWordLimitSummary?.trim() || deriveWordLimitSummary(sections),
  };

  if (!firstRow) {
    throw new Error(`No prompt rows found for ${school.name}`);
  }

  return { school, summary, prompts };
}

async function cleanupMisfiledPrompts(payload: DerivedSchoolPayload) {
  for (const rule of MISFILED_PROMPT_CLEANUPS) {
    if (normalizeSchoolName(payload.school.name) !== normalizeSchoolName(rule.targetSchoolName)) {
      continue;
    }

    const mistakenSchool = await fetchSchools().then((schools) =>
      schools.find(
        (school) =>
          normalizeSchoolName(school.name) === normalizeSchoolName(rule.mistakenSchoolName)
      ) ?? null
    );

    if (!mistakenSchool) continue;

    const mistakenPromptTexts = payload.prompts.map((prompt) => prompt.prompt_text);

    const { error } = await supabase
      .from("essay_prompts")
      .delete()
      .eq("school_id", mistakenSchool.id)
      .in("prompt_text", mistakenPromptTexts);

    if (error) {
      console.error(`Cleanup failed for ${rule.mistakenSchoolName}: ${error.message}`);
    } else {
      console.log(`✓ Cleaned misfiled prompts from ${rule.mistakenSchoolName}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonPath = args.find((arg) => !arg.startsWith("--"));
  const dryRun = args.includes("--dry-run");
  const replace = args.includes("--replace");

  if (!jsonPath) {
    usageAndExit("Missing JSON file path");
  }

  const rows = loadInputRows(jsonPath);
  const initialSchools = await fetchSchools();
  const schoolLookup = buildSchoolLookup(initialSchools);
  const fallbackCache = new Map<string, SchoolRow | null>();
  const matchedBySchoolId = new Map<
    string,
    { school: SchoolRow; rows: JsonEssayRow[] }
  >();
  const unmatchedSchools = new Map<string, number>();

  for (const row of rows) {
    let match = pickSchoolMatch(row.school_name, schoolLookup);

    if (!match && scorecardApiKey) {
      if (!fallbackCache.has(row.school_name)) {
        if (dryRun) {
          fallbackCache.set(row.school_name, null);
        } else {
          const fallbackSchool = await searchScorecardSchoolByName(row.school_name);
          fallbackCache.set(row.school_name, fallbackSchool);
          if (fallbackSchool) {
            const key = normalizeSchoolName(fallbackSchool.name);
            const existing = schoolLookup.get(key) ?? [];
            schoolLookup.set(key, [...existing, fallbackSchool]);
          }
        }
      }

      match = fallbackCache.get(row.school_name) ?? null;
    }

    if (!match) {
      unmatchedSchools.set(
        row.school_name,
        (unmatchedSchools.get(row.school_name) ?? 0) + 1
      );
      continue;
    }

    const existing = matchedBySchoolId.get(match.id) ?? {
      school: match,
      rows: [],
    };

    existing.rows.push(row);
    matchedBySchoolId.set(match.id, existing);
  }

  const matchedSchools = Array.from(matchedBySchoolId.values()).map((entry) =>
    deriveSchoolPayload(entry.school, entry.rows)
  );

  console.log(`Loaded ${rows.length} rows from ${path.resolve(jsonPath)}`);
  console.log(`Matched ${matchedSchools.length} schools in Supabase`);
  console.log(
    `Unmatched schools: ${unmatchedSchools.size} (${Array.from(unmatchedSchools.values()).reduce(
      (sum, count) => sum + count,
      0
    )} rows)`
  );
  console.log(
    `Mode: ${dryRun ? "dry-run" : replace ? "replace existing prompts" : "insert + backfill existing prompts"}`
  );
  if (scorecardApiKey) {
    console.log(
      `Scorecard fallback: ${dryRun ? "configured but skipped during dry-run" : "enabled"}`
    );
  } else {
    console.log("Scorecard fallback: disabled (COLLEGE_SCORECARD_API_KEY not set)");
  }

  if (unmatchedSchools.size) {
    console.log("\nUnmatched school names:");
    for (const [schoolName, count] of Array.from(unmatchedSchools.entries()).sort()) {
      console.log(`- ${schoolName} (${count} rows)`);
    }
  }

  if (dryRun) {
    console.log("\nDry run only. No database writes performed.");
    console.log(
      "If you want the importer to auto-add missing schools from College Scorecard, run without --dry-run."
    );
    return;
  }

  const matchedIds = matchedSchools.map((payload) => payload.school.id);
  const existingPromptMap = new Map<
    string,
    Map<string, { id: string }>
  >();

  if (!replace && matchedIds.length > 0) {
    const { data: existingPrompts, error: existingErr } = await supabase
      .from("essay_prompts")
      .select("id, school_id, prompt_text")
      .in("school_id", matchedIds);

    if (existingErr) {
      throw new Error(`Failed to load existing essay prompts: ${existingErr.message}`);
    }

    (existingPrompts ?? []).forEach((prompt) => {
      const schoolId = String(prompt.school_id);
      const schoolMap = existingPromptMap.get(schoolId) ?? new Map<string, { id: string }>();
      schoolMap.set(normalizePromptText(String(prompt.prompt_text)), {
        id: String(prompt.id),
      });
      existingPromptMap.set(schoolId, schoolMap);
    });
  }

  let insertedCount = 0;
  let updatedCount = 0;

  for (const payload of matchedSchools) {
    await cleanupMisfiledPrompts(payload);

    const { error: summaryErr } = await supabase
      .from("essay_requirement_summaries")
      .upsert(payload.summary, { onConflict: "school_id" });

    if (summaryErr) {
      console.error(`Summary upsert failed for ${payload.school.name}: ${summaryErr.message}`);
      continue;
    }

    if (replace) {
      const { error: deleteErr } = await supabase
        .from("essay_prompts")
        .delete()
        .eq("school_id", payload.school.id);

      if (deleteErr) {
        console.error(`Delete failed for ${payload.school.name}: ${deleteErr.message}`);
        continue;
      }

      if (payload.prompts.length > 0) {
        const { error: insertErr } = await supabase
          .from("essay_prompts")
          .insert(payload.prompts);

        if (insertErr) {
          console.error(`Insert failed for ${payload.school.name}: ${insertErr.message}`);
          continue;
        }
      }

      insertedCount += payload.prompts.length;
      console.log(`✓ ${payload.school.name}: replaced with ${payload.prompts.length} structured prompts`);
      continue;
    }

    const schoolExistingMap = existingPromptMap.get(payload.school.id) ?? new Map<string, { id: string }>();
    let schoolInserted = 0;
    let schoolUpdated = 0;

    for (const prompt of payload.prompts) {
      const existingPrompt = schoolExistingMap.get(normalizePromptText(prompt.prompt_text));

      if (existingPrompt) {
        const { error: updateErr } = await supabase
          .from("essay_prompts")
          .update({
            word_limit: prompt.word_limit,
            section_key: prompt.section_key,
            section_title: prompt.section_title,
            section_order: prompt.section_order,
            prompt_order: prompt.prompt_order,
            prompt_title: prompt.prompt_title,
          })
          .eq("id", existingPrompt.id);

        if (updateErr) {
          console.error(`Update failed for ${payload.school.name}: ${updateErr.message}`);
          continue;
        }

        schoolUpdated += 1;
        continue;
      }

      const { error: insertErr } = await supabase.from("essay_prompts").insert(prompt);

      if (insertErr) {
        console.error(`Insert failed for ${payload.school.name}: ${insertErr.message}`);
        continue;
      }

      schoolInserted += 1;
    }

    insertedCount += schoolInserted;
    updatedCount += schoolUpdated;
    console.log(
      `✓ ${payload.school.name}: inserted ${schoolInserted}, backfilled ${schoolUpdated}, summary updated`
    );
  }

  console.log("\nDone.");
  console.log(`Inserted prompts: ${insertedCount}`);
  console.log(`Backfilled existing prompts: ${updatedCount}`);
  console.log(
    "Structured metadata is now stored in essay_requirement_summaries and the new essay_prompts fields."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
