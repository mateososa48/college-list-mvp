"use client";

import { useState, useCallback } from "react";
import AddSchoolModal from "@/components/add-school-modal";
import SchoolDetailPanel from "@/components/school-detail-panel";
import { PlusIcon, FunnelIcon } from "@heroicons/react/24/outline";

type Attainability = "Reach" | "Target" | "Safety";
type AppType = "EA" | "ED" | "RD" | "Undecided";
type Status =
  | "Planning"
  | "In Progress"
  | "Submitted"
  | "Accepted"
  | "Deferred"
  | "Waitlisted"
  | "Rejected";

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

interface UserSchoolRow {
  id: string;
  attainability: Attainability | null;
  app_type: AppType;
  status: Status;
  notes: string | null;
  added_at: string;
  schools: School;
}

interface CollegeTableProps {
  initialRows: UserSchoolRow[];
  columnPrefs: Record<string, boolean>;
}

const ATTAINABILITY_STYLES: Record<Attainability, string> = {
  Reach: "bg-red-50 text-red-700 border-red-200",
  Target: "bg-blue-50 text-blue-700 border-blue-200",
  Safety: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_STYLES: Record<Status, string> = {
  Planning: "bg-stone-100 text-stone-600 border-stone-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Submitted: "bg-blue-50 text-blue-700 border-blue-200",
  Accepted: "bg-green-50 text-green-700 border-green-200",
  Deferred: "bg-orange-50 text-orange-700 border-orange-200",
  Waitlisted: "bg-purple-50 text-purple-700 border-purple-200",
  Rejected: "bg-red-50 text-red-600 border-red-200",
};

const APP_TYPES: AppType[] = ["EA", "ED", "RD", "Undecided"];
const STATUSES: Status[] = [
  "Planning",
  "In Progress",
  "Submitted",
  "Accepted",
  "Deferred",
  "Waitlisted",
  "Rejected",
];

function formatAcceptance(rate: number | null) {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(0)}%`;
}

function formatSAT(low: number | null, high: number | null) {
  if (!low || !high) return "—";
  return `${low}–${high}`;
}

function formatGPA(gpa: number | null) {
  if (!gpa) return "—";
  return gpa.toFixed(2);
}

function formatPrice(price: number | null) {
  if (!price) return "—";
  return `$${price.toLocaleString()}`;
}

export default function CollegeTable({ initialRows, columnPrefs }: CollegeTableProps) {
  const [rows, setRows] = useState<UserSchoolRow[]>(initialRows);
  const [filter, setFilter] = useState<Attainability | "All">("All");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const col = (key: string) => columnPrefs[key] !== false;

  const filtered =
    filter === "All" ? rows : rows.filter((r) => r.attainability === filter);

  const counts = {
    All: rows.length,
    Reach: rows.filter((r) => r.attainability === "Reach").length,
    Target: rows.filter((r) => r.attainability === "Target").length,
    Safety: rows.filter((r) => r.attainability === "Safety").length,
  };

  function handleSchoolAdded(newRow: UserSchoolRow) {
    setRows((prev) => [newRow, ...prev]);
  }

  async function updateField(id: string, fields: Partial<UserSchoolRow>) {
    // Optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...fields } : r))
    );
    await fetch("/api/schools/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
  }

  function openPanel(school: School) {
    setSelectedSchool(school);
    setPanelOpen(true);
  }

  const saveNotes = useCallback(
    async (id: string) => {
      await updateField(id, { notes: notesValue } as Partial<UserSchoolRow>);
      setEditingNotes(null);
    },
    [notesValue]
  );

  return (
    <div>
      {/* Table header row: filter chips + add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <FunnelIcon className="w-4 h-4 mr-1" style={{ color: "#78716C" }} />
          {(["All", "Reach", "Target", "Safety"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === f
                  ? f === "All"
                    ? "bg-stone-800 text-white border-stone-800"
                    : f === "Reach"
                    ? "bg-red-600 text-white border-red-600"
                    : f === "Target"
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-green-700 text-white border-green-700"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {f}
              <span
                className={`text-[10px] font-semibold px-1 rounded ${
                  filter === f ? "opacity-70" : "opacity-50"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <AddSchoolModal onSchoolAdded={handleSchoolAdded} />
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#EFF6FF" }}
          >
            <PlusIcon className="w-6 h-6" style={{ color: "#1E3A8A" }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "#1A1A1A" }}>
            Your list is empty
          </h3>
          <p className="text-sm max-w-xs" style={{ color: "#78716C" }}>
            Click &quot;+ Add School&quot; to search for colleges. Data will be
            auto-populated from the College Scorecard.
          </p>
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "#E7E5E4" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr
                className="border-b text-left"
                style={{ borderColor: "#E7E5E4", backgroundColor: "#F7F7F6" }}
              >
                <th
                  className="sticky left-0 z-10 px-4 py-3 text-xs font-semibold tracking-wide"
                  style={{
                    color: "#78716C",
                    backgroundColor: "#F7F7F6",
                    minWidth: "200px",
                  }}
                >
                  School
                </th>
                {col("location") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    Location
                  </th>
                )}
                {col("type") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    Type
                  </th>
                )}
                {col("attainability") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    Fit
                  </th>
                )}
                {col("acceptance_rate") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    Acceptance
                  </th>
                )}
                {col("sat_range") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    SAT Range
                  </th>
                )}
                {col("avg_gpa") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    Avg GPA
                  </th>
                )}
                {col("test_policy") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    Test Policy
                  </th>
                )}
                {col("net_tuition") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    Net Price
                  </th>
                )}
                {col("app_type") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    App Type
                  </th>
                )}
                {col("status") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    Status
                  </th>
                )}
                {col("notes") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C", minWidth: "160px" }}>
                    Notes
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors group"
                  style={{
                    borderColor: i === filtered.length - 1 ? "transparent" : "#E7E5E4",
                    backgroundColor: "white",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#F7F7F6";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "white";
                  }}
                >
                  {/* School name (sticky) */}
                  <td
                    className="sticky left-0 px-4 py-3 font-medium z-10 transition-colors"
                    style={{ backgroundColor: "inherit" }}
                  >
                    <button
                      onClick={() => openPanel(row.schools)}
                      className="text-left hover:underline underline-offset-2 transition-colors"
                      style={{ color: "#1A1A1A" }}
                    >
                      {row.schools.name}
                    </button>
                  </td>

                  {col("location") && (
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#78716C" }}>
                      {row.schools.city && row.schools.state
                        ? `${row.schools.city}, ${row.schools.state}`
                        : "—"}
                    </td>
                  )}

                  {col("type") && (
                    <td className="px-4 py-3" style={{ color: "#78716C" }}>
                      {row.schools.school_type ?? "—"}
                    </td>
                  )}

                  {col("attainability") && (
                    <td className="px-4 py-3">
                      {row.attainability ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ATTAINABILITY_STYLES[row.attainability]}`}
                        >
                          {row.attainability}
                        </span>
                      ) : (
                        <span style={{ color: "#78716C" }}>—</span>
                      )}
                    </td>
                  )}

                  {col("acceptance_rate") && (
                    <td className="px-4 py-3" style={{ color: "#78716C" }}>
                      {formatAcceptance(row.schools.acceptance_rate)}
                    </td>
                  )}

                  {col("sat_range") && (
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#78716C" }}>
                      {formatSAT(row.schools.sat_25th, row.schools.sat_75th)}
                    </td>
                  )}

                  {col("avg_gpa") && (
                    <td className="px-4 py-3" style={{ color: "#78716C" }}>
                      {formatGPA(row.schools.avg_gpa)}
                    </td>
                  )}

                  {col("test_policy") && (
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#78716C" }}>
                      {row.schools.test_policy ?? "—"}
                    </td>
                  )}

                  {col("net_tuition") && (
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#78716C" }}>
                      {formatPrice(row.schools.net_price)}
                    </td>
                  )}

                  {col("app_type") && (
                    <td className="px-4 py-3">
                      <select
                        value={row.app_type}
                        onChange={(e) =>
                          updateField(row.id, { app_type: e.target.value as AppType })
                        }
                        className="text-xs rounded-md border px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-900"
                        style={{ borderColor: "#E7E5E4", color: "#1A1A1A" }}
                      >
                        {APP_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}

                  {col("status") && (
                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        onChange={(e) =>
                          updateField(row.id, { status: e.target.value as Status })
                        }
                        className={`text-xs rounded-full border px-2.5 py-1 cursor-pointer focus:outline-none ${STATUS_STYLES[row.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}

                  {col("notes") && (
                    <td className="px-4 py-3">
                      {editingNotes === row.id ? (
                        <input
                          autoFocus
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          onBlur={() => saveNotes(row.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveNotes(row.id);
                            if (e.key === "Escape") setEditingNotes(null);
                          }}
                          className="w-full text-xs border-b bg-transparent focus:outline-none pb-0.5"
                          style={{ borderColor: "#1E3A8A", color: "#1A1A1A" }}
                          placeholder="Add a note..."
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotes(row.id);
                            setNotesValue(row.notes ?? "");
                          }}
                          className="text-xs text-left w-full truncate max-w-[180px] transition-colors"
                          style={{ color: row.notes ? "#1A1A1A" : "#C4C0BB" }}
                        >
                          {row.notes || "Add a note..."}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SchoolDetailPanel
        school={selectedSchool}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
