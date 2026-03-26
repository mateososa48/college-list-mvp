"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";

interface School {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  school_type: string | null;
  acceptance_rate: number | null;
  sat_25th: number | null;
  sat_75th: number | null;
  avg_gpa: number | null;
  test_policy: string | null;
  net_price: number | null;
}

interface EssayPrompt {
  id: string;
  prompt_text: string;
  word_limit: number | null;
}

interface SchoolDetailPanelProps {
  school: School | null;
  open: boolean;
  onClose: () => void;
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

export default function SchoolDetailPanel({ school, open, onClose }: SchoolDetailPanelProps) {
  const [essays, setEssays] = useState<EssayPrompt[]>([]);
  const [loadingEssays, setLoadingEssays] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!school || !open) return;
    setEssays([]);
    setLoadingEssays(true);

    supabase
      .from("essay_prompts")
      .select("id, prompt_text, word_limit")
      .eq("school_id", school.id)
      .then(({ data }) => {
        setEssays(data ?? []);
        setLoadingEssays(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.id, open]);

  if (!school) return null;

  const acceptance = school.acceptance_rate !== null
    ? `${(school.acceptance_rate * 100).toFixed(0)}%`
    : "—";

  const satRange = school.sat_25th && school.sat_75th
    ? `${school.sat_25th}–${school.sat_75th}`
    : "—";

  const gpa = school.avg_gpa ? school.avg_gpa.toFixed(2) : "—";
  const price = school.net_price ? `$${school.net_price.toLocaleString()}` : "—";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-0"
        style={{ borderColor: "#E7E5E4" }}
      >
        {/* Header */}
        <SheetHeader
          className="px-6 py-5 border-b sticky top-0 z-10"
          style={{ borderColor: "#E7E5E4", backgroundColor: "white" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base font-semibold leading-tight" style={{ color: "#1A1A1A" }}>
                {school.name}
              </SheetTitle>
              <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>
                {[school.city, school.state].filter(Boolean).join(", ")}
                {school.school_type ? ` · ${school.school_type}` : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-stone-100 transition-colors flex-shrink-0 mt-0.5"
            >
              <XMarkIcon className="w-4 h-4" style={{ color: "#78716C" }} />
            </button>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Stats grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#78716C" }}>
              Key Stats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCell label="Acceptance Rate" value={acceptance} />
              <StatCell label="SAT Range" value={satRange} />
              <StatCell label="Average GPA" value={gpa} />
              <StatCell label="Test Policy" value={school.test_policy ?? "—"} />
              <StatCell label="Net Price / yr" value={price} />
              <StatCell label="Type" value={school.school_type ?? "—"} />
            </div>
          </div>

          {/* Essay prompts */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#78716C" }}>
              Essay Prompts
            </h3>

            {loadingEssays && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-stone-200 border-t-blue-900 rounded-full animate-spin" />
              </div>
            )}

            {!loadingEssays && essays.length === 0 && (
              <p className="text-sm" style={{ color: "#78716C" }}>
                No essay prompts on file for this school yet.
              </p>
            )}

            {!loadingEssays && essays.length > 0 && (
              <div className="space-y-3">
                {essays.map((essay, i) => (
                  <div
                    key={essay.id}
                    className="rounded-lg border p-4"
                    style={{ borderColor: "#E7E5E4" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#78716C" }}>
                        Prompt {i + 1}
                      </span>
                      {essay.word_limit && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={{ color: "#78716C", borderColor: "#E7E5E4" }}
                        >
                          {essay.word_limit} words
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>
                      {essay.prompt_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
