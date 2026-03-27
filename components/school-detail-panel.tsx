"use client";

import { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { XMarkIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import {
  buildEssayRequirementsViewModel,
  type EssayRequirementSummaryRow,
  type EssayRequirementsViewModel,
  type StructuredEssayPromptRow,
} from "@/lib/essay-requirements";

interface School {
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
}

interface UserSchoolRow {
  id: string;
  attainability: string | null;
  app_type: string;
  status: string;
  notes: string | null;
  added_at: string;
  schools: School;
}

interface SchoolDetailPanelProps {
  row: UserSchoolRow | null;
  open: boolean;
  onClose: () => void;
  onNotesChange: (id: string, notes: string) => void;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: "#F7F7F6" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#78716C" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
        {value}
      </p>
    </div>
  );
}

function RequirementLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-lg leading-8" style={{ color: "#2E2D2B" }}>
      <span className="font-semibold" style={{ color: "#1A1A1A" }}>
        {label}:
      </span>{" "}
      {value}
    </p>
  );
}

function LegacyEssayPromptList({ prompts }: { prompts: EssayRequirementsViewModel["legacyPrompts"] }) {
  return (
    <div className="space-y-3">
      {prompts.map((essay, i) => (
        <div key={essay.id} className="rounded-lg border p-4" style={{ borderColor: "#E7E5E4" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#78716C" }}>
              Prompt {i + 1}
            </span>
            {essay.wordLimit && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                style={{ color: "#78716C", borderColor: "#E7E5E4" }}
              >
                {essay.wordLimit} words
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>
            {essay.promptText}
          </p>
        </div>
      ))}
    </div>
  );
}

function EssayRequirementsSection({ requirements }: { requirements: EssayRequirementsViewModel }) {
  if (requirements.mode === "legacy") {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#78716C" }}>
          Essay Prompts
        </h3>
        <LegacyEssayPromptList prompts={requirements.legacyPrompts} />
      </div>
    );
  }

  const summaryLines = [
    { label: "Application Type", value: requirements.summary?.applicationType ?? null },
    { label: "Number of Essays", value: requirements.summary?.essayCountSummary ?? null },
    { label: "Word Limit", value: requirements.summary?.wordLimitSummary ?? null },
  ].filter((line): line is { label: string; value: string } => !!line.value);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h3
          className="text-3xl sm:text-4xl font-semibold tracking-tight"
          style={{ color: "#1A1A1A", lineHeight: 1.05 }}
        >
          {requirements.title}
        </h3>

        {summaryLines.length > 0 && (
          <div className="space-y-4 max-w-3xl">
            {summaryLines.map((line) => (
              <RequirementLine key={line.label} label={line.label} value={line.value} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-10">
        {requirements.sections.map((section) => (
          <section key={section.key} className="space-y-5">
            <h4
              className="text-2xl sm:text-3xl font-semibold tracking-tight"
              style={{ color: "#1A1A1A", lineHeight: 1.1 }}
            >
              {section.title}
            </h4>

            {section.displayStyle === "numbered_list" ? (
              <ol
                className="space-y-4 pl-8 max-w-4xl text-lg sm:text-[1.9rem]"
                style={{ color: "#2E2D2B", lineHeight: 1.65 }}
              >
                {section.prompts.map((prompt) => (
                  <li key={prompt.id} className="pl-2">
                    {prompt.promptText}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="space-y-10 max-w-4xl">
                {section.prompts.map((prompt, index) => (
                  <div key={prompt.id} className="space-y-3">
                    <h5
                      className="text-2xl sm:text-[2.05rem] font-semibold tracking-tight"
                      style={{ color: "#1A1A1A", lineHeight: 1.15 }}
                    >
                      {prompt.promptTitle ?? `Essay ${index + 1}`}
                    </h5>
                    <p
                      className="text-xl sm:text-[1.85rem]"
                      style={{ color: "#2E2D2B", lineHeight: 1.7 }}
                    >
                      {prompt.promptText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function fmt(n: number | null, prefix = "", suffix = "", decimals = 0) {
  if (n === null || n === undefined) return "—";
  return `${prefix}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

export default function SchoolDetailPanel({ row, open, onClose, onNotesChange }: SchoolDetailPanelProps) {
  const [essayRequirements, setEssayRequirements] = useState<EssayRequirementsViewModel>({
    mode: "legacy",
    title: "Essay Prompts",
    summary: null,
    sections: [],
    legacyPrompts: [],
  });
  const [loadingEssays, setLoadingEssays] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [logoError, setLogoError] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const school = row?.schools ?? null;

  useEffect(() => {
    if (!school || !open) return;
    const schoolId = school.id;

    setEssayRequirements({
      mode: "legacy",
      title: "Essay Prompts",
      summary: null,
      sections: [],
      legacyPrompts: [],
    });
    setLoadingEssays(true);
    setLogoError(false);

    async function loadEssayRequirements() {
      const summaryPromise = supabase
        .from("essay_requirement_summaries")
        .select("school_id, display_title, application_type, essay_count_summary, word_limit_summary")
        .eq("school_id", schoolId)
        .maybeSingle();

      const structuredPromptsPromise = supabase
        .from("essay_prompts")
        .select("id, prompt_text, word_limit, section_key, section_title, section_order, prompt_order, prompt_title")
        .eq("school_id", schoolId)
        .order("section_order", { ascending: true })
        .order("prompt_order", { ascending: true });

      let summary: EssayRequirementSummaryRow | null = null;
      let prompts: StructuredEssayPromptRow[] = [];

      try {
        const [{ data: summaryData }, structuredResponse] = await Promise.all([
          summaryPromise,
          structuredPromptsPromise,
        ]);

        summary = summaryData as EssayRequirementSummaryRow | null;

        if (structuredResponse.error) {
          const legacyResponse = await supabase
            .from("essay_prompts")
            .select("id, prompt_text, word_limit")
            .eq("school_id", schoolId);

          prompts = (legacyResponse.data ?? []) as StructuredEssayPromptRow[];
        } else {
          prompts = (structuredResponse.data ?? []) as StructuredEssayPromptRow[];
        }
      } catch {
        const legacyResponse = await supabase
          .from("essay_prompts")
          .select("id, prompt_text, word_limit")
          .eq("school_id", schoolId);

        prompts = (legacyResponse.data ?? []) as StructuredEssayPromptRow[];
      }

      setEssayRequirements(buildEssayRequirementsViewModel(summary, prompts));
      setLoadingEssays(false);
    }

    loadEssayRequirements();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.id, open]);

  useEffect(() => {
    setNotesValue(row?.notes ?? "");
  }, [row?.id, row?.notes]);

  async function saveNotes() {
    if (!row) return;
    onNotesChange(row.id, notesValue);
    await fetch("/api/schools/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, notes: notesValue }),
    });
  }

  if (!school || !row) return null;

  const acceptance = school.acceptance_rate !== null
    ? `${(school.acceptance_rate * 100).toFixed(0)}%` : "—";
  const satRange = school.sat_25th && school.sat_75th
    ? `${school.sat_25th}–${school.sat_75th}` : "—";
  const gradRate = school.grad_rate !== null
    ? `${(school.grad_rate * 100).toFixed(0)}%` : "—";

  const faviconUrl = school.website_url
    ? `https://www.google.com/s2/favicons?domain=${school.website_url}&sz=64`
    : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-0"
        style={{ borderColor: "#E7E5E4" }}
      >
        <SheetHeader
          className="px-6 py-5 border-b sticky top-0 z-10"
          style={{ borderColor: "#E7E5E4", backgroundColor: "white" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {faviconUrl && !logoError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={faviconUrl}
                  alt=""
                  width={40}
                  height={40}
                  onError={() => setLogoError(true)}
                  className="w-10 h-10 rounded-lg object-contain flex-shrink-0 border p-1 bg-white"
                  style={{ borderColor: "#E7E5E4" }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
                  style={{ borderColor: "#E7E5E4", backgroundColor: "#F7F7F6" }}
                >
                  <AcademicCapIcon className="w-5 h-5" style={{ color: "#78716C" }} />
                </div>
              )}
              <div className="min-w-0">
                <SheetTitle className="text-base font-semibold leading-tight" style={{ color: "#1A1A1A" }}>
                  {school.name}
                </SheetTitle>
                <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>
                  {[school.city, school.state].filter(Boolean).join(", ")}
                  {school.school_type ? ` · ${school.school_type}` : ""}
                  {school.setting ? ` · ${school.setting}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-stone-100 transition-colors flex-shrink-0 mt-0.5"
            >
              <XMarkIcon className="w-4 h-4" style={{ color: "#78716C" }} />
            </button>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-8">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#78716C" }}>
              Admissions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCell label="Acceptance Rate" value={acceptance} />
              <StatCell label="SAT Range" value={satRange} />
              <StatCell label="Test Policy" value={school.test_policy ?? "—"} />
              <StatCell label="Enrollment" value={school.enrollment ? school.enrollment.toLocaleString() : "—"} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#78716C" }}>
              Cost
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCell label="Tuition (listed)" value={fmt(school.tuition_out_of_state, "$")} />
              <StatCell label="Avg Net Price†" value={fmt(school.net_price, "$")} />
              {school.school_type === "Public" && (
                <StatCell label="In-State Tuition" value={fmt(school.tuition_in_state, "$")} />
              )}
            </div>
            <p className="text-[10px] mt-2" style={{ color: "#78716C" }}>
              † Average net price for families earning $110k+/yr after grants &amp; scholarships.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#78716C" }}>
              Outcomes
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCell label="4-yr Grad Rate" value={gradRate} />
              <StatCell label="Median Earnings (10yr)" value={fmt(school.median_earnings, "$")} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#78716C" }}>
              Notes
            </h3>
            <textarea
              ref={notesRef}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes about this school..."
              rows={3}
              className="w-full text-sm rounded-lg border px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-900 transition-shadow"
              style={{ borderColor: "#E7E5E4", color: "#1A1A1A", backgroundColor: "#FAFAF9" }}
            />
          </div>

          <div>
            {loadingEssays ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-stone-200 border-t-blue-900 rounded-full animate-spin" />
              </div>
            ) : essayRequirements.mode === "legacy" && essayRequirements.legacyPrompts.length === 0 ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#78716C" }}>
                  Essay Prompts
                </h3>
                <p className="text-sm" style={{ color: "#78716C" }}>
                  No essay prompts on file for this school yet.
                </p>
              </div>
            ) : (
              <EssayRequirementsSection requirements={essayRequirements} />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
