"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const COLUMN_OPTIONS = [
  { id: "location", label: "Location" },
  { id: "type", label: "School Type (Public/Private)" },
  { id: "attainability", label: "Attainability (Reach/Target/Safety)" },
  { id: "acceptance_rate", label: "Acceptance Rate" },
  { id: "sat_range", label: "SAT Range" },
  { id: "avg_gpa", label: "Average GPA" },
  { id: "test_policy", label: "Test Policy" },
  { id: "net_tuition", label: "Net Tuition" },
  { id: "app_type", label: "Application Type (EA/ED/RD)" },
  { id: "status", label: "Application Status" },
  { id: "notes", label: "Notes" },
];

const DEFAULT_COLUMNS = Object.fromEntries(COLUMN_OPTIONS.map((c) => [c.id, true]));

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [gpa, setGpa] = useState("");
  const [scoreType, setScoreType] = useState<"sat" | "act">("sat");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [columns, setColumns] = useState<Record<string, boolean>>(DEFAULT_COLUMNS);
  const [saving, setSaving] = useState(false);

  async function saveAndFinish(skipAll = false) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("profiles").upsert({
      id: user.id,
      gpa: skipAll || !gpa ? null : parseFloat(gpa),
      sat_score: skipAll || scoreType !== "sat" || !satScore ? null : parseInt(satScore),
      act_score: skipAll || scoreType !== "act" || !actScore ? null : parseInt(actScore),
      column_preferences: skipAll ? DEFAULT_COLUMNS : columns,
      onboarding_completed: true,
    });

    setSaving(false);
    router.push("/dashboard");
  }

  function toggleColumn(id: string) {
    setColumns((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAFAF9" }}>
      <div className="w-full max-w-lg px-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2].map((s) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: step === s ? "24px" : "8px",
                backgroundColor: step >= s ? "#1E3A8A" : "#E7E5E4",
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: "#1A1A1A" }}>
              Tell us about yourself
            </h2>
            <p className="text-sm mb-8" style={{ color: "#78716C" }}>
              We use this to calculate your Reach, Target, and Safety schools automatically.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                  GPA (unweighted)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="e.g. 3.85"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  className="h-10 text-sm max-w-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                  Test score
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setScoreType("sat")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${scoreType === "sat" ? "border-blue-900 text-blue-900 bg-blue-50" : "border-stone-200 text-stone-500"}`}
                  >
                    SAT
                  </button>
                  <button
                    onClick={() => setScoreType("act")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${scoreType === "act" ? "border-blue-900 text-blue-900 bg-blue-50" : "border-stone-200 text-stone-500"}`}
                  >
                    ACT
                  </button>
                </div>
                {scoreType === "sat" ? (
                  <Input
                    type="number"
                    min="400"
                    max="1600"
                    step="10"
                    placeholder="e.g. 1480"
                    value={satScore}
                    onChange={(e) => setSatScore(e.target.value)}
                    className="h-10 text-sm max-w-xs"
                  />
                ) : (
                  <Input
                    type="number"
                    min="1"
                    max="36"
                    placeholder="e.g. 32"
                    value={actScore}
                    onChange={(e) => setActScore(e.target.value)}
                    className="h-10 text-sm max-w-xs"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-10">
              <button
                onClick={() => saveAndFinish(true)}
                className="text-sm underline underline-offset-2"
                style={{ color: "#78716C" }}
              >
                Skip for now
              </button>
              <Button
                onClick={() => setStep(2)}
                className="h-9 px-5 text-sm"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                Next →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: "#1A1A1A" }}>
              Choose your columns
            </h2>
            <p className="text-sm mb-8" style={{ color: "#78716C" }}>
              Pick what data you want visible in your table. You can change this anytime.
            </p>

            <div className="space-y-3">
              {COLUMN_OPTIONS.map((col) => (
                <label
                  key={col.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <Checkbox
                    checked={columns[col.id]}
                    onCheckedChange={() => toggleColumn(col.id)}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: "#1A1A1A" }}>
                    {col.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between mt-10">
              <button
                onClick={() => setStep(1)}
                className="text-sm underline underline-offset-2"
                style={{ color: "#78716C" }}
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveAndFinish(false)}
                  className="text-sm underline underline-offset-2"
                  style={{ color: "#78716C" }}
                >
                  Skip
                </button>
                <Button
                  onClick={() => saveAndFinish(false)}
                  disabled={saving}
                  className="h-9 px-5 text-sm"
                  style={{ backgroundColor: "#1E3A8A" }}
                >
                  {saving ? "Saving..." : "Done →"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
