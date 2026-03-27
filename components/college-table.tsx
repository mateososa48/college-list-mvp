"use client";

import { useState, useCallback } from "react";
import AddSchoolModal from "@/components/add-school-modal";
import SchoolDetailPanel from "@/components/school-detail-panel";
import {
  PlusIcon,
  FunnelIcon,
  AcademicCapIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  MapIcon,
  UsersIcon,
  AdjustmentsHorizontalIcon,
  PercentBadgeIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  FlagIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

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

const ATTAINABILITIES: (Attainability | "")[] = ["", "Reach", "Target", "Safety"];
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

function formatEnrollment(n: number | null) {
  if (!n) return "—";
  return n.toLocaleString();
}

function formatPrice(price: number | null) {
  if (!price) return "—";
  return `$${price.toLocaleString()}`;
}

// Column header with icon
function ColHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#78716C" }} />
      {label}
    </span>
  );
}

// Styled select with custom chevron
function StyledSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer pr-6 focus:outline-none ${className ?? ""}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-1.5 w-3 h-3 flex-shrink-0"
        style={{ color: "currentColor", opacity: 0.5 }}
      />
    </div>
  );
}

export default function CollegeTable({ initialRows, columnPrefs }: CollegeTableProps) {
  const [rows, setRows] = useState<UserSchoolRow[]>(initialRows);
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Attainability | "All">("All");
  const [sortKey, setSortKey] = useState<string>("added_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<UserSchoolRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const col = (key: string) => columnPrefs[key] !== false;

  const SORT_OPTIONS = [
    { key: "added_at", label: "Date Added" },
    { key: "name", label: "School Name" },
    { key: "fit", label: "Fit" },
    { key: "acceptance_rate", label: "Acceptance Rate" },
    { key: "sat_25th", label: "SAT Score" },
    { key: "enrollment", label: "Enrollment Size" },
    { key: "tuition_out_of_state", label: "Tuition" },
  ];

  const FIT_ORDER: Record<string, number> = { Safety: 1, Target: 2, Reach: 3 };

  function getSortValue(row: UserSchoolRow, key: string): number | string {
    if (key === "added_at") return row.added_at;
    if (key === "name") return row.schools.name;
    if (key === "fit") return FIT_ORDER[row.attainability ?? ""] ?? 4;
    if (key === "acceptance_rate") return row.schools.acceptance_rate ?? 999;
    if (key === "sat_25th") return row.schools.sat_25th ?? 0;
    if (key === "enrollment") return row.schools.enrollment ?? 0;
    if (key === "tuition_out_of_state") return row.schools.tuition_out_of_state ?? 0;
    return 0;
  }

  const filtered = [...(filter === "All" ? rows : rows.filter((r) => r.attainability === filter))].sort((a, b) => {
    const av = getSortValue(a, sortKey);
    const bv = getSortValue(b, sortKey);
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const counts = {
    All: rows.length,
    Reach: rows.filter((r) => r.attainability === "Reach").length,
    Target: rows.filter((r) => r.attainability === "Target").length,
    Safety: rows.filter((r) => r.attainability === "Safety").length,
  };

  const activeFilterLabel = filter === "All" ? null : filter;
  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Date Added";

  function handleSchoolAdded(newRow: UserSchoolRow) {
    setRows((prev) => [newRow, ...prev]);
  }

  async function updateField(id: string, fields: Partial<UserSchoolRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...fields } : r))
    );
    if (selectedRow?.id === id) {
      setSelectedRow((prev) => prev ? { ...prev, ...fields } : prev);
    }
    await fetch("/api/schools/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
  }

  async function removeSchool(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (selectedRow?.id === id) setPanelOpen(false);
    await fetch("/api/schools/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function openPanel(row: UserSchoolRow) {
    setSelectedRow(row);
    setPanelOpen(true);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveNotes = useCallback(
    async (id: string) => {
      await updateField(id, { notes: notesValue } as Partial<UserSchoolRow>);
      setEditingNotes(null);
    },
    [notesValue]
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">

          {/* Filter pill */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                activeFilterLabel
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              {activeFilterLabel ? `Fit: ${activeFilterLabel}` : "Filter"}
              <ChevronDownIcon className="w-3 h-3 opacity-60" />
            </button>
            {filterOpen && (
              <div
                className="absolute left-0 top-10 z-50 w-48 rounded-xl border bg-white shadow-lg py-1"
                style={{ borderColor: "#E7E5E4" }}
                onMouseLeave={() => setFilterOpen(false)}
              >
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#78716C" }}>Fit</p>
                {(["All", "Reach", "Target", "Safety"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setFilterOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-stone-50 transition-colors"
                    style={{ color: "#1A1A1A" }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${f === "Reach" ? "bg-red-500" : f === "Target" ? "bg-blue-600" : f === "Safety" ? "bg-green-600" : "bg-stone-400"}`} />
                      {f}
                      <span className="text-[10px] opacity-50">{counts[f as keyof typeof counts] ?? counts.All}</span>
                    </span>
                    {filter === f && <CheckIcon className="w-3.5 h-3.5" style={{ color: "#1E3A8A" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort pill */}
          <div className="relative">
            <button
              onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                sortKey !== "added_at"
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <ArrowsUpDownIcon className="w-3.5 h-3.5" />
              {sortKey !== "added_at" ? `Sort: ${activeSortLabel}` : "Sort"}
              <ChevronDownIcon className="w-3 h-3 opacity-60" />
            </button>
            {sortOpen && (
              <div
                className="absolute left-0 top-10 z-50 w-52 rounded-xl border bg-white shadow-lg py-1"
                style={{ borderColor: "#E7E5E4" }}
                onMouseLeave={() => setSortOpen(false)}
              >
                <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#78716C" }}>Sort by</p>
                  <div className="flex rounded-md overflow-hidden border text-[10px] font-medium" style={{ borderColor: "#E7E5E4" }}>
                    {(["asc", "desc"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setSortDir(d)}
                        className={`px-2 py-0.5 transition-colors ${sortDir === d ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"}`}
                      >
                        {d === "asc" ? "↑ Asc" : "↓ Desc"}
                      </button>
                    ))}
                  </div>
                </div>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-stone-50 transition-colors"
                    style={{ color: "#1A1A1A" }}
                  >
                    {opt.label}
                    {sortKey === opt.key && <CheckIcon className="w-3.5 h-3.5" style={{ color: "#1E3A8A" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
        <AddSchoolModal onSchoolAdded={handleSchoolAdded} />
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#EFF6FF" }}>
            <PlusIcon className="w-6 h-6" style={{ color: "#1E3A8A" }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "#1A1A1A" }}>Your list is empty</h3>
          <p className="text-sm max-w-xs" style={{ color: "#78716C" }}>
            Click &quot;+ Add School&quot; to search for colleges.
          </p>
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "#E7E5E4" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "#E7E5E4", backgroundColor: "#F7F7F6" }}>
                <th className="sticky left-0 z-10 px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C", backgroundColor: "#F7F7F6", minWidth: "240px", maxWidth: "240px", width: "240px" }}>
                  <ColHeader icon={AcademicCapIcon} label="School" />
                </th>
                {col("location") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    <ColHeader icon={MapPinIcon} label="Location" />
                  </th>
                )}
                {col("type") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    <ColHeader icon={BuildingOfficeIcon} label="Type" />
                  </th>
                )}
                {col("setting") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    <ColHeader icon={MapIcon} label="Setting" />
                  </th>
                )}
                {col("enrollment") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    <ColHeader icon={UsersIcon} label="Size" />
                  </th>
                )}
                {col("attainability") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    <ColHeader icon={AdjustmentsHorizontalIcon} label="Fit" />
                  </th>
                )}
                {col("acceptance_rate") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    <ColHeader icon={PercentBadgeIcon} label="Acceptance" />
                  </th>
                )}
                {col("sat_range") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    <ColHeader icon={PencilSquareIcon} label="SAT Range" />
                  </th>
                )}
                {col("test_policy") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    <ColHeader icon={ClipboardDocumentCheckIcon} label="Test Policy" />
                  </th>
                )}
                {col("net_tuition") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: "#78716C" }}>
                    <ColHeader icon={CurrencyDollarIcon} label="Tuition" />
                  </th>
                )}
                {col("app_type") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    <ColHeader icon={CalendarDaysIcon} label="App Type" />
                  </th>
                )}
                {col("status") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C" }}>
                    <ColHeader icon={FlagIcon} label="Status" />
                  </th>
                )}
                {col("notes") && (
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#78716C", minWidth: "160px" }}>
                    <ColHeader icon={ChatBubbleLeftEllipsisIcon} label="Notes" />
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
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F7F7F6"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "white"; }}
                >
                  {/* School name (sticky) */}
                  <td className="sticky left-0 px-4 py-3 z-10 transition-colors" style={{ backgroundColor: "inherit", maxWidth: "240px", width: "240px" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Favicon logo */}
                      {row.schools.website_url && !logoErrors.has(row.id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${row.schools.website_url}&sz=32`}
                          alt=""
                          width={18}
                          height={18}
                          onError={() => setLogoErrors((prev) => new Set(prev).add(row.id))}
                          className="w-[18px] h-[18px] rounded-sm object-contain flex-shrink-0"
                        />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-sm flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "#F7F7F6" }}>
                          <AcademicCapIcon className="w-3 h-3" style={{ color: "#C4C0BB" }} />
                        </div>
                      )}
                      <button
                        onClick={() => openPanel(row)}
                        className="text-left text-sm font-medium hover:underline underline-offset-2 transition-colors flex-1 truncate min-w-0"
                        style={{ color: "#1A1A1A" }}
                        title={row.schools.name}
                      >
                        {row.schools.name}
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openPanel(row)}
                          title="View details"
                          className="p-0.5 rounded hover:bg-stone-200 transition-colors"
                          style={{ color: "#A8A29E" }}
                        >
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeSchool(row.id)}
                          title="Remove school"
                          className="p-0.5 rounded hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "#78716C" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#78716C")}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {col("location") && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "#78716C" }}>
                      {row.schools.city && row.schools.state ? `${row.schools.city}, ${row.schools.state}` : "—"}
                    </td>
                  )}

                  {col("type") && (
                    <td className="px-4 py-3 text-sm" style={{ color: "#78716C" }}>
                      {row.schools.school_type ?? "—"}
                    </td>
                  )}

                  {col("setting") && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "#78716C" }}>
                      {row.schools.setting ?? "—"}
                    </td>
                  )}

                  {col("enrollment") && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "#78716C" }}>
                      {formatEnrollment(row.schools.enrollment)}
                    </td>
                  )}

                  {col("attainability") && (
                    <td className="px-4 py-3">
                      <StyledSelect
                        value={row.attainability ?? ""}
                        onChange={(val) => {
                          const v = val as Attainability | "";
                          updateField(row.id, { attainability: v === "" ? null : v as Attainability });
                        }}
                        options={ATTAINABILITIES.map((a) => ({ value: a, label: a === "" ? "Set fit…" : a }))}
                        className={`text-xs rounded-full border px-2.5 py-1 ${
                          row.attainability ? ATTAINABILITY_STYLES[row.attainability] : "bg-stone-100 text-stone-400 border-stone-200"
                        }`}
                      />
                    </td>
                  )}

                  {col("acceptance_rate") && (
                    <td className="px-4 py-3 text-sm" style={{ color: "#78716C" }}>
                      {formatAcceptance(row.schools.acceptance_rate)}
                    </td>
                  )}

                  {col("sat_range") && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "#78716C" }}>
                      {formatSAT(row.schools.sat_25th, row.schools.sat_75th)}
                    </td>
                  )}

                  {col("test_policy") && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "#78716C" }}>
                      {row.schools.test_policy ?? "—"}
                    </td>
                  )}

                  {col("net_tuition") && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: "#78716C" }}>
                      {formatPrice(row.schools.tuition_out_of_state)}
                    </td>
                  )}

                  {col("app_type") && (
                    <td className="px-4 py-3">
                      <StyledSelect
                        value={row.app_type}
                        onChange={(val) => updateField(row.id, { app_type: val as AppType })}
                        options={APP_TYPES.map((t) => ({ value: t, label: t }))}
                        className="text-xs rounded-md border px-2 py-1 bg-white"
                      />
                    </td>
                  )}

                  {col("status") && (
                    <td className="px-4 py-3">
                      <StyledSelect
                        value={row.status}
                        onChange={(val) => updateField(row.id, { status: val as Status })}
                        options={STATUSES.map((s) => ({ value: s, label: s }))}
                        className={`text-xs rounded-full border px-2.5 py-1 ${STATUS_STYLES[row.status]}`}
                      />
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
                          onClick={() => { setEditingNotes(row.id); setNotesValue(row.notes ?? ""); }}
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
        row={selectedRow}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onNotesChange={(id, notes) => updateField(id, { notes } as Partial<UserSchoolRow>)}
      />
    </div>
  );
}
