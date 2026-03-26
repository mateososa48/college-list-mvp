"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import TopBar from "@/components/top-bar";
import { classify } from "@/lib/attainability";

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

export default function SettingsPage() {
  const router = useRouter();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = createClient();

  const [gpa, setGpa] = useState("");
  const [scoreType, setScoreType] = useState<"sat" | "act">("sat");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [columns, setColumns] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("gpa, sat_score, act_score, column_preferences")
        .eq("id", user.id)
        .single();

      if (profile) {
        setGpa(profile.gpa?.toString() ?? "");
        setSatScore(profile.sat_score?.toString() ?? "");
        setActScore(profile.act_score?.toString() ?? "");
        if (profile.act_score && !profile.sat_score) setScoreType("act");
        setColumns(profile.column_preferences ?? {});
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newGpa = gpa ? parseFloat(gpa) : null;
    const newSat = scoreType === "sat" && satScore ? parseInt(satScore) : null;
    const newAct = scoreType === "act" && actScore ? parseInt(actScore) : null;

    await supabase.from("profiles").update({
      gpa: newGpa,
      sat_score: newSat,
      act_score: newAct,
      column_preferences: columns,
    }).eq("id", user.id);

    // Recompute attainability for all user's schools
    const { data: userSchools } = await supabase
      .from("user_schools")
      .select("id, school_id, schools(sat_25th, sat_75th, avg_gpa, acceptance_rate)")
      .eq("user_id", user.id);

    if (userSchools && (newSat || newGpa)) {
      const actToSat: Record<number, number> = {
        36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400,
        30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210,
        24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040, 19: 1010,
      };
      const satForClassify = newSat ?? (newAct ? actToSat[newAct] ?? null : null);

      for (const row of userSchools) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const school = (row as any).schools;
        const attainability = classify(satForClassify, newGpa, school);
        await supabase
          .from("user_schools")
          .update({ attainability })
          .eq("id", row.id);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleColumn(id: string) {
    setColumns((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAFAF9" }}>
        <TopBar />
        <div className="flex justify-center py-24">
          <div className="w-5 h-5 border-2 border-stone-200 border-t-blue-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF9" }}>
      <TopBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold tracking-tight mb-8" style={{ color: "#1A1A1A" }}>
          Settings
        </h1>

        {/* Academic profile */}
        <section className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#E7E5E4" }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: "#1A1A1A" }}>
            Academic Profile
          </h2>
          <p className="text-xs mb-5" style={{ color: "#78716C" }}>
            Used to auto-calculate your Reach, Target, and Safety schools.
          </p>

          <div className="space-y-4 max-w-xs">
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
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#1A1A1A" }}>
                Test Score
              </label>
              <div className="flex gap-2 mb-2">
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
                  className="h-9 text-sm"
                />
              ) : (
                <Input
                  type="number"
                  min="1"
                  max="36"
                  placeholder="e.g. 32"
                  value={actScore}
                  onChange={(e) => setActScore(e.target.value)}
                  className="h-9 text-sm"
                />
              )}
            </div>
          </div>
        </section>

        {/* Column preferences */}
        <section className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: "#E7E5E4" }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "#1A1A1A" }}>
            Visible Columns
          </h2>
          <p className="text-xs mb-5" style={{ color: "#78716C" }}>
            Choose which columns appear in your college list table.
          </p>
          <div className="space-y-3">
            {COLUMN_OPTIONS.map((col) => (
              <label key={col.id} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={columns[col.id] ?? true}
                  onCheckedChange={() => toggleColumn(col.id)}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: "#1A1A1A" }}>
                  {col.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center justify-between">
          <button
            onClick={signOut}
            className="text-sm underline underline-offset-2"
            style={{ color: "#78716C" }}
          >
            Sign out
          </button>
          <Button
            onClick={save}
            disabled={saving}
            className="h-9 px-5 text-sm"
            style={{ backgroundColor: saved ? "#16A34A" : "#1E3A8A" }}
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
          </Button>
        </div>
      </main>
    </div>
  );
}
