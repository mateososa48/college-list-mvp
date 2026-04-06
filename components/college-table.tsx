"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AddSchoolModal from "@/components/add-school-modal";
import SchoolDetailPanel from "@/components/school-detail-panel";
import { createClient } from "@/lib/supabase/client";
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
  XMarkIcon,
  SwatchIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

// Star with a diagonal slash — used for "unstar" action button
function StarSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      <line x1="3" y1="3" x2="21" y2="21" strokeWidth={1.5} />
    </svg>
  );
}

const DETAIL_HINT_KEY = "clm_detail_hint_dismissed";

function DetailHintCallout({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="absolute z-20 left-1"
      style={{
        top: "44px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* upward arrow */}
      <div
        style={{
          width: 10,
          height: 10,
          backgroundColor: "var(--cr-card-bg)",
          border: "1px solid #E7E5E4",
          borderBottom: "none",
          borderRight: "none",
          transform: "rotate(45deg)",
          marginLeft: 20,
          marginBottom: -5,
          position: "relative",
          zIndex: 1,
        }}
      />
      {/* card */}
      <div
        className="rounded-xl bg-[var(--cr-card-bg)]"
        style={{
          border: "1px solid #E7E5E4",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          width: 268,
        }}
      >
        <div
          className="rounded-t-xl px-3 pt-2.5 pb-2 flex items-start justify-between gap-2"
          style={{ borderBottom: "1px solid #F0EEE9" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--cr-brand-bg)" }}
            >
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" style={{ color: "var(--cr-brand)" }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--cr-text)", letterSpacing: "-0.01em" }}>
              Explore any school
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-0.5 rounded-md transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 mt-0.5"
            aria-label="Dismiss"
          >
            <XMarkIcon className="w-3.5 h-3.5" style={{ color: "var(--cr-text-faint)" }} />
          </button>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-xs leading-relaxed" style={{ color: "var(--cr-text-muted)" }}>
            Click a school&apos;s{" "}
            <span className="font-medium" style={{ color: "var(--cr-text)" }}>name</span>
            {" "}or the{" "}
            <span
              className="inline-flex items-center gap-1 font-medium align-middle px-1.5 py-0.5 rounded-md"
              style={{ color: "#6B7280", backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: "11px", lineHeight: 1 }}
            >
              <ArrowTopRightOnSquareIcon className="w-2.5 h-2.5" style={{ display: "inline" }} />
              Explore
            </span>
            {" "}button to open its full detail panel.
          </p>
        </div>
      </div>
    </div>
  );
}

const DISPLAY_NAME_MAP: Record<string, string> = {
  "Massachusetts Institute of Technology": "MIT",
  "New York University": "NYU",
  "University of Southern California": "USC",
  "University of California-Los Angeles": "UCLA",
  "Carnegie Mellon University": "CMU",
  "Rensselaer Polytechnic Institute": "RPI",
  "Worcester Polytechnic Institute": "WPI",
  "Texas Christian University": "TCU",
  "Southern Methodist University": "SMU",
  "University of California-Berkeley": "UC Berkeley",
  "University of California-San Diego": "UC San Diego",
  "University of California-Santa Barbara": "UC Santa Barbara",
  "University of California-Santa Cruz": "UC Santa Cruz",
  "University of California-Davis": "UC Davis",
  "University of California-Irvine": "UC Irvine",
  "University of California-Riverside": "UC Riverside",
  "University of Virginia-Main Campus": "UVA",
  "University of North Carolina at Chapel Hill": "UNC",
  "University of Michigan-Ann Arbor": "UMich",
  "Georgia Institute of Technology-Main Campus": "Georgia Tech",
};

function displayName(fullName: string): string {
  return DISPLAY_NAME_MAP[fullName] ?? fullName;
}

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
  latitude?: number | null;
  longitude?: number | null;
}

interface UserSchoolRow {
  id: string;
  attainability: Attainability | null;
  app_type: AppType;
  status: Status;
  notes: string | null;
  added_at: string;
  is_favorite: boolean;
  schools: School;
}

type AttainabilityColorName = "red"|"orange"|"amber"|"yellow"|"green"|"cyan"|"blue"|"indigo"|"violet"|"pink";

const COLOR_PALETTE: Record<AttainabilityColorName, { dot: string; pillBg: string; pillText: string; pillBorder: string; rowBg: string; rowHover: string; }> = {
  red:    { dot:"#F87171", pillBg:"var(--cr-pill-red-bg)",    pillText:"var(--cr-pill-red-text)",    pillBorder:"var(--cr-pill-red-border)",    rowBg:"var(--cr-row-red-bg)",    rowHover:"var(--cr-row-red-hover)" },
  orange: { dot:"#FB923C", pillBg:"var(--cr-pill-orange-bg)", pillText:"var(--cr-pill-orange-text)", pillBorder:"var(--cr-pill-orange-border)", rowBg:"var(--cr-row-orange-bg)", rowHover:"var(--cr-row-orange-hover)" },
  amber:  { dot:"#FBBF24", pillBg:"var(--cr-pill-amber-bg)",  pillText:"var(--cr-pill-amber-text)",  pillBorder:"var(--cr-pill-amber-border)",  rowBg:"var(--cr-row-amber-bg)",  rowHover:"var(--cr-row-amber-hover)" },
  yellow: { dot:"#FACC15", pillBg:"var(--cr-pill-yellow-bg)", pillText:"var(--cr-pill-yellow-text)", pillBorder:"var(--cr-pill-yellow-border)", rowBg:"var(--cr-row-yellow-bg)", rowHover:"var(--cr-row-yellow-hover)" },
  green:  { dot:"#4ADE80", pillBg:"var(--cr-pill-green-bg)",  pillText:"var(--cr-pill-green-text)",  pillBorder:"var(--cr-pill-green-border)",  rowBg:"var(--cr-row-green-bg)",  rowHover:"var(--cr-row-green-hover)" },
  cyan:   { dot:"#22D3EE", pillBg:"var(--cr-pill-cyan-bg)",   pillText:"var(--cr-pill-cyan-text)",   pillBorder:"var(--cr-pill-cyan-border)",   rowBg:"var(--cr-row-cyan-bg)",   rowHover:"var(--cr-row-cyan-hover)" },
  blue:   { dot:"#60A5FA", pillBg:"var(--cr-pill-blue-bg)",   pillText:"var(--cr-pill-blue-text)",   pillBorder:"var(--cr-pill-blue-border)",   rowBg:"var(--cr-row-blue-bg)",   rowHover:"var(--cr-row-blue-hover)" },
  indigo: { dot:"#818CF8", pillBg:"var(--cr-pill-indigo-bg)", pillText:"var(--cr-pill-indigo-text)", pillBorder:"var(--cr-pill-indigo-border)", rowBg:"var(--cr-row-indigo-bg)", rowHover:"var(--cr-row-indigo-hover)" },
  violet: { dot:"#A78BFA", pillBg:"var(--cr-pill-violet-bg)", pillText:"var(--cr-pill-violet-text)", pillBorder:"var(--cr-pill-violet-border)", rowBg:"var(--cr-row-violet-bg)", rowHover:"var(--cr-row-violet-hover)" },
  pink:   { dot:"#F472B6", pillBg:"var(--cr-pill-pink-bg)",   pillText:"var(--cr-pill-pink-text)",   pillBorder:"var(--cr-pill-pink-border)",   rowBg:"var(--cr-row-pink-bg)",   rowHover:"var(--cr-row-pink-hover)" },
};

const PALETTE_ORDER: AttainabilityColorName[] = ["red","orange","amber","yellow","green","cyan","blue","indigo","violet","pink"];

function getAttainabilityStyle(fit: Attainability, colors: Record<Attainability, AttainabilityColorName>): React.CSSProperties {
  const p = COLOR_PALETTE[colors[fit]];
  return { backgroundColor: p.pillBg, color: p.pillText, borderColor: p.pillBorder };
}

interface DisplayPrefs {
  colorRows?: boolean;
  attainabilityColors?: { Reach?: string; Target?: string; Safety?: string };
}

interface CollegeTableProps {
  initialRows: UserSchoolRow[];
  columnPrefs: Record<string, boolean>;
  displayPrefs: DisplayPrefs;
}

const APP_TYPE_STYLES: Record<AppType, string> = {
  ED: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
  RD: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
  EA: "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900",
  Undecided: "bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700",
};

const STATUS_STYLES: Record<Status, string> = {
  Planning: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
  Submitted: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
  Accepted: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900",
  Deferred: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900",
  Waitlisted: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900",
  Rejected: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
};

const HEADER_CELL_CLASS = "px-4 py-2 text-xs font-semibold tracking-wide";
const BODY_CELL_CLASS = "px-4 py-1.5 text-sm align-middle";
const BODY_CELL_NOWRAP_CLASS = `${BODY_CELL_CLASS} whitespace-nowrap`;
const BODY_CONTROL_CELL_CLASS = "px-4 py-1.5 align-middle";
const PILL_SELECT_CLASS = "h-7 rounded-full border px-2.5 pr-7 text-xs leading-none";
const APP_TYPE_SELECT_CLASS = "h-6 rounded-full border pl-2 pr-5 text-xs leading-none w-[58px]";

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
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--cr-text-muted)" }} />
      {label}
    </span>
  );
}

function FitInfoTooltip() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setPos(null);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [pos]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const r = btnRef.current!.getBoundingClientRect();
    const W = 260;
    const left = Math.min(r.left, window.innerWidth - W - 12);
    setPos({ top: r.bottom + 8, left: Math.max(8, left) });
  }

  return (
    <div className="inline-flex ml-1" style={{ verticalAlign: "middle" }}>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex-shrink-0 transition-opacity"
        style={{ opacity: pos ? 1 : 0.5, lineHeight: 0 }}
        aria-label="What do Reach, Target, and Safety mean?"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7.25" stroke="var(--cr-text-muted)" strokeWidth="1.5"/>
          <circle cx="8" cy="5.5" r="1" fill="var(--cr-text-muted)"/>
          <rect x="7.25" y="7.5" width="1.5" height="4" rx="0.75" fill="var(--cr-text-muted)"/>
        </svg>
      </button>
      {pos && createPortal(
        <div
          ref={ref}
          className="rounded-lg shadow-lg p-3 text-xs leading-relaxed"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            backgroundColor: "#1E293B",
            color: "#E2E8F0",
            width: "260px",
            pointerEvents: "none",
            fontWeight: 400,
          }}
        >
          <div className="space-y-2">
            <div><span className="font-semibold text-white">Reach</span> — Your stats are below the school&apos;s typical range. Admission is possible but not likely.</div>
            <div><span className="font-semibold text-white">Target</span> — Your stats are in line with the school&apos;s admitted class. You have a reasonable chance.</div>
            <div><span className="font-semibold text-white">Safety</span> — Your stats are comfortably above the school&apos;s typical range. You&apos;re very likely to get in.</div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function AppTypeInfoTooltip() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setPos(null);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [pos]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    const r = btnRef.current!.getBoundingClientRect();
    const W = 270;
    const left = Math.min(r.right - W, window.innerWidth - W - 12);
    setPos({ top: r.bottom + 8, left: Math.max(8, left) });
  }

  return (
    <div className="inline-flex ml-1" style={{ verticalAlign: "middle" }}>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex-shrink-0 transition-opacity"
        style={{ opacity: pos ? 1 : 0.5, lineHeight: 0 }}
        aria-label="What do the application types mean?"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7.25" stroke="var(--cr-text-muted)" strokeWidth="1.5"/>
          <circle cx="8" cy="5.5" r="1" fill="var(--cr-text-muted)"/>
          <rect x="7.25" y="7.5" width="1.5" height="4" rx="0.75" fill="var(--cr-text-muted)"/>
        </svg>
      </button>
      {pos && createPortal(
        <div
          ref={ref}
          className="rounded-lg shadow-lg p-3 text-xs leading-relaxed"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            backgroundColor: "#1E293B",
            color: "#E2E8F0",
            width: "270px",
            pointerEvents: "none",
            fontWeight: 400,
          }}
        >
          <div className="space-y-2">
            <div><span className="font-semibold text-white">ED (Early Decision)</span> — Binding. If admitted, you must attend. Typically higher acceptance rates. Deadline usually Nov 1–15.</div>
            <div><span className="font-semibold text-white">EA (Early Action)</span> — Non-binding. Apply early and hear back sooner, but you&apos;re not committed to attend.</div>
            <div><span className="font-semibold text-white">RD (Regular Decision)</span> — Standard application round. Deadline typically Jan 1–15, decisions in March–April.</div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Styled select with custom chevron
function StyledSelect({
  value,
  onChange,
  options,
  className,
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="relative inline-flex min-w-0 items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer pr-7 leading-none focus:outline-none ${className ?? ""}`}
        style={style}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 flex-shrink-0"
        style={{ color: "currentColor", opacity: 0.5 }}
      />
    </div>
  );
}

function CustomizePopup({
  colorRows,
  onColorRowsChange,
  attainabilityColors,
  onAttainabilityColorChange,
}: {
  colorRows: boolean;
  onColorRowsChange: (val: boolean) => void;
  attainabilityColors: Record<Attainability, AttainabilityColorName>;
  onAttainabilityColorChange: (fit: Attainability, color: AttainabilityColorName) => void;
}) {
  const fitRows: { fit: Attainability; label: string }[] = [
    { fit: "Reach", label: "Reach" },
    { fit: "Target", label: "Target" },
    { fit: "Safety", label: "Safety" },
  ];

  return (
    <div
      className="absolute left-0 z-50 rounded-xl bg-[var(--cr-card-bg)]"
      style={{
        top: "38px",
        width: "360px",
        border: "1px solid #E7E5E4",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Display section */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--cr-text-faint)" }}>Display</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--cr-text)" }}>Color rows by fit</span>
          <button
            onClick={() => onColorRowsChange(!colorRows)}
            style={{
              width: 32,
              height: 18,
              borderRadius: 9,
              backgroundColor: colorRows ? "var(--cr-brand)" : "var(--cr-border)",
              position: "relative",
              transition: "background-color 0.2s ease",
              flexShrink: 0,
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Toggle color rows"
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: colorRows ? 16 : 2,
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "var(--cr-card-bg)",
                transition: "left 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #F0EEE9" }} />

      {/* Fit colors section */}
      <div className="px-4 pt-3 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--cr-text-faint)" }}>Fit Colors</p>
        <div className="flex flex-col">
          {fitRows.map(({ fit, label }, idx) => (
            <div key={fit}>
              {idx > 0 && <div style={{ borderTop: "1px solid #F0EEE9", marginBottom: "10px" }} />}
              <div className="flex items-center gap-3" style={{ marginBottom: idx < fitRows.length - 1 ? "10px" : 0 }}>
                <span className="text-xs font-medium w-12 flex-shrink-0" style={{ color: "var(--cr-text-body)" }}>{label}</span>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {PALETTE_ORDER.map((colorName) => {
                    const isSelected = attainabilityColors[fit] === colorName;
                    return (
                      <button
                        key={colorName}
                        onClick={() => onAttainabilityColorChange(fit, colorName)}
                        title={colorName}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: COLOR_PALETTE[colorName].dot,
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "box-shadow 0.15s ease",
                          boxShadow: isSelected
                            ? `0 0 0 2px white, 0 0 0 3.5px ${COLOR_PALETTE[colorName].dot}`
                            : "none",
                        }}
                        aria-label={`Set ${fit} to ${colorName}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileSchoolCard({
  row,
  onOpen,
  onRemove,
  attainabilityColors,
  logoError,
  onLogoError,
}: {
  row: UserSchoolRow;
  onOpen: (row: UserSchoolRow) => void;
  onRemove: (id: string) => void;
  attainabilityColors: Record<Attainability, AttainabilityColorName>;
  logoError: boolean;
  onLogoError: (id: string) => void;
}) {
  const fitStyle = row.attainability ? getAttainabilityStyle(row.attainability, attainabilityColors) : null;
  const fitDotColor = row.attainability
    ? COLOR_PALETTE[attainabilityColors[row.attainability]].dot
    : "transparent";
  const location = [row.schools.city, row.schools.state].filter(Boolean).join(", ");

  return (
    <div
      className="flex items-stretch border-b"
      style={{ borderColor: "var(--cr-border)" }}
    >
      {/* Fit color bar */}
      <div className="w-[3px] flex-shrink-0" style={{ backgroundColor: fitDotColor }} />

      {/* Tappable main area */}
      <button
        onClick={() => onOpen(row)}
        className="flex-1 flex items-center gap-2.5 px-3 py-2.5 min-w-0 text-left active:bg-stone-50"
      >
        {/* Favicon */}
        <div className="flex-shrink-0">
          {row.schools.website_url && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://www.google.com/s2/favicons?domain=${row.schools.website_url}&sz=32`}
              alt=""
              width={16}
              height={16}
              onError={() => onLogoError(row.id)}
              className="w-4 h-4 rounded-sm object-contain"
            />
          ) : (
            <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ backgroundColor: "var(--cr-subtle-bg)" }}>
              <AcademicCapIcon className="w-2.5 h-2.5" style={{ color: "var(--cr-text-disabled)" }} />
            </div>
          )}
        </div>

        {/* Name + location */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight" style={{ color: "var(--cr-text)" }}>{displayName(row.schools.name)}</p>
          {location && (
            <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: "var(--cr-text-faint)" }}>{location}</p>
          )}
        </div>

        {/* Pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {row.attainability && fitStyle && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border" style={fitStyle}>
              {row.attainability}
            </span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_STYLES[row.status]}`}>
            {row.status}
          </span>
        </div>
      </button>

      {/* Trash */}
      <button
        onClick={() => onRemove(row.id)}
        className="px-3 flex items-center flex-shrink-0"
        style={{ color: "var(--cr-text-ghost)" }}
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CollegeTable({ initialRows, columnPrefs, displayPrefs }: CollegeTableProps) {
  const supabase = createClient();
  const [rows, setRows] = useState<UserSchoolRow[]>(initialRows);
  // Sync rows when the server re-fetches fresh data (e.g. after router.refresh())
  const prevInitialRowsRef = useRef(initialRows);
  useEffect(() => {
    if (initialRows !== prevInitialRowsRef.current) {
      prevInitialRowsRef.current = initialRows;
      setRows(initialRows);
    }
  }, [initialRows]);
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Attainability | "All">("All");
  const [sortKey, setSortKey] = useState<string>("fit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [colorRows, setColorRows] = useState<boolean>(displayPrefs?.colorRows ?? false);
  const [attainabilityColors, setAttainabilityColors] = useState<Record<Attainability, AttainabilityColorName>>({
    Reach:  (displayPrefs?.attainabilityColors?.Reach  as AttainabilityColorName) ?? "red",
    Target: (displayPrefs?.attainabilityColors?.Target as AttainabilityColorName) ?? "blue",
    Safety: (displayPrefs?.attainabilityColors?.Safety as AttainabilityColorName) ?? "green",
  });
  const customizeRef = useRef<HTMLDivElement>(null);
  const [triggerAddModal, setTriggerAddModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<UserSchoolRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [exploreSchool, setExploreSchool] = useState<School | null>(null);
  const [explorePanelOpen, setExplorePanelOpen] = useState(false);
  const [exploreFromSearch, setExploreFromSearch] = useState(false);
  const [showDetailHint, setShowDetailHint] = useState(false);
  const [favCapToast, setFavCapToast] = useState<string | null>(null);
  const favCapToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(DETAIL_HINT_KEY)) {
      setShowDetailHint(true);
    }
  }, []);

  function dismissDetailHint() {
    setShowDetailHint(false);
    localStorage.setItem(DETAIL_HINT_KEY, "1");
  }

  useEffect(() => {
    if (!customizeOpen) return;
    function handleClick(e: MouseEvent) {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) {
        setCustomizeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [customizeOpen]);

  async function saveDisplayPrefs(prefs: { colorRows: boolean; attainabilityColors: Record<Attainability, AttainabilityColorName> }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ display_preferences: prefs }).eq("id", user.id);
  }

  async function handleColorRowsChange(val: boolean) {
    setColorRows(val);
    await saveDisplayPrefs({ colorRows: val, attainabilityColors });
  }

  async function handleAttainabilityColorChange(fit: Attainability, color: AttainabilityColorName) {
    const next = { ...attainabilityColors, [fit]: color };
    setAttainabilityColors(next);
    await saveDisplayPrefs({ colorRows, attainabilityColors: next });
  }

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

  const FIT_ORDER: Record<string, number> = { Reach: 1, Target: 2, Safety: 3 };

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
    if (sortKey === "fit") {
      const fitA = FIT_ORDER[a.attainability ?? ""] ?? 4;
      const fitB = FIT_ORDER[b.attainability ?? ""] ?? 4;
      const fitCmp = fitA - fitB;
      if (fitCmp !== 0) return sortDir === "asc" ? fitCmp : -fitCmp;
      // Within same fit group: favorites first, then by acceptance rate ascending
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      const rateA = a.schools.acceptance_rate ?? 999;
      const rateB = b.schools.acceptance_rate ?? 999;
      return rateA - rateB;
    }
    // For all other sort keys: favorites still float to top within same fit group
    const fitA = FIT_ORDER[a.attainability ?? ""] ?? 4;
    const fitB = FIT_ORDER[b.attainability ?? ""] ?? 4;
    if (fitA === fitB && a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    const av = getSortValue(a, sortKey);
    const bv = getSortValue(b, sortKey);
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const anyFavorited = rows.some((r) => r.is_favorite);

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

  async function toggleFavorite(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    if (!row.is_favorite) {
      const favoriteCount = rows.filter((r) => r.is_favorite).length;
      if (favoriteCount >= 3) {
        if (favCapToastTimer.current) clearTimeout(favCapToastTimer.current);
        setFavCapToast(id);
        favCapToastTimer.current = setTimeout(() => setFavCapToast(null), 2500);
        return;
      }
    }
    await updateField(id, { is_favorite: !row.is_favorite });
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

  async function saveNotes(id: string) {
    await updateField(id, { notes: notesValue } as Partial<UserSchoolRow>);
    setEditingNotes(null);
  }

  return (
    <div>
      {/* Mobile toolbar */}
      <div className="flex items-center justify-between mb-3 md:hidden">
        <span className="text-sm font-medium" style={{ color: "var(--cr-text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? "school" : "schools"}
        </span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                activeFilterLabel
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              {activeFilterLabel ? `Fit: ${activeFilterLabel}` : "Filter"}
              <ChevronDownIcon className="w-3 h-3 opacity-60" />
            </button>
            {filterOpen && (
              <div
                className="absolute right-0 top-10 z-50 w-48 rounded-xl border bg-[var(--cr-card-bg)] shadow-lg py-1"
                style={{ borderColor: "var(--cr-border)" }}
              >
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--cr-text-muted)" }}>Fit</p>
                {(["All", "Reach", "Target", "Safety"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setFilterOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                    style={{ color: "var(--cr-text)" }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${f === "Reach" ? "bg-red-500" : f === "Target" ? "bg-blue-600" : f === "Safety" ? "bg-green-600" : "bg-stone-400"}`} />
                      {f}
                      <span className="text-[10px] opacity-50">{counts[f as keyof typeof counts] ?? counts.All}</span>
                    </span>
                    {filter === f && <CheckIcon className="w-3.5 h-3.5" style={{ color: "var(--cr-brand)" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Sort pill (mobile) */}
          <div className="relative">
            <button
              onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                !(sortKey === "fit" && sortDir === "asc")
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              <ArrowsUpDownIcon className="w-3.5 h-3.5" />
              {!(sortKey === "fit" && sortDir === "asc") ? activeSortLabel : "Sort"}
            </button>
            {sortOpen && (
              <div
                className="absolute right-0 top-10 z-50 w-48 rounded-xl border bg-[var(--cr-card-bg)] shadow-lg py-1"
                style={{ borderColor: "var(--cr-border)" }}
              >
                <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--cr-text-muted)" }}>Sort by</p>
                  <div className="flex rounded-md overflow-hidden border text-[10px] font-medium" style={{ borderColor: "var(--cr-border)" }}>
                    {(["asc", "desc"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setSortDir(d)}
                        className={`px-2 py-0.5 transition-colors ${sortDir === d ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"}`}
                      >
                        {d === "asc" ? "↑" : "↓"}
                      </button>
                    ))}
                  </div>
                </div>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                    style={{ color: "var(--cr-text)" }}
                  >
                    {opt.label}
                    {sortKey === opt.key && <CheckIcon className="w-3.5 h-3.5" style={{ color: "var(--cr-brand)" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setTriggerAddModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "var(--cr-brand)", color: "white" }}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden md:flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">

          {/* Filter pill */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                activeFilterLabel
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              {activeFilterLabel ? `Fit: ${activeFilterLabel}` : "Filter"}
              <ChevronDownIcon className="w-3 h-3 opacity-60" />
            </button>
            {filterOpen && (
              <div
                className="absolute left-0 top-10 z-50 w-48 rounded-xl border bg-[var(--cr-card-bg)] shadow-lg py-1"
                style={{ borderColor: "var(--cr-border)" }}
                onMouseLeave={() => setFilterOpen(false)}
              >
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--cr-text-muted)" }}>Fit</p>
                {(["All", "Reach", "Target", "Safety"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setFilterOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                    style={{ color: "var(--cr-text)" }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${f === "Reach" ? "bg-red-500" : f === "Target" ? "bg-blue-600" : f === "Safety" ? "bg-green-600" : "bg-stone-400"}`} />
                      {f}
                      <span className="text-[10px] opacity-50">{counts[f as keyof typeof counts] ?? counts.All}</span>
                    </span>
                    {filter === f && <CheckIcon className="w-3.5 h-3.5" style={{ color: "var(--cr-brand)" }} />}
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
                !(sortKey === "fit" && sortDir === "asc")
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              <ArrowsUpDownIcon className="w-3.5 h-3.5" />
              {!(sortKey === "fit" && sortDir === "asc") ? `Sort: ${activeSortLabel}` : "Sort"}
              <ChevronDownIcon className="w-3 h-3 opacity-60" />
            </button>
            {sortOpen && (
              <div
                className="absolute left-0 top-10 z-50 w-52 rounded-xl border bg-[var(--cr-card-bg)] shadow-lg py-1"
                style={{ borderColor: "var(--cr-border)" }}
                onMouseLeave={() => setSortOpen(false)}
              >
                <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--cr-text-muted)" }}>Sort by</p>
                  <div className="flex rounded-md overflow-hidden border text-[10px] font-medium" style={{ borderColor: "var(--cr-border)" }}>
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
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                    style={{ color: "var(--cr-text)" }}
                  >
                    {opt.label}
                    {sortKey === opt.key && <CheckIcon className="w-3.5 h-3.5" style={{ color: "var(--cr-brand)" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customize */}
          <div className="relative" ref={customizeRef}>
            <button
              onClick={() => { setCustomizeOpen((v) => !v); setFilterOpen(false); setSortOpen(false); }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition-colors"
              style={{
                backgroundColor: customizeOpen ? "var(--cr-subtle-bg)" : "var(--cr-card-bg)",
                borderColor: "var(--cr-border)",
                color: "var(--cr-text-body)",
              }}
            >
              <SwatchIcon className="w-3.5 h-3.5" />
              Customize
            </button>
            {customizeOpen && (
              <CustomizePopup
                colorRows={colorRows}
                onColorRowsChange={handleColorRowsChange}
                attainabilityColors={attainabilityColors}
                onAttainabilityColorChange={handleAttainabilityColorChange}
              />
            )}
          </div>

          {/* School count */}
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--cr-tag-bg)", color: "var(--cr-text-muted)" }}>
            {rows.length} {rows.length === 1 ? "school" : "schools"}
          </span>

        </div>
        <AddSchoolModal
          onSchoolAdded={handleSchoolAdded}
          externalOpen={triggerAddModal}
          onExternalOpenConsumed={() => setTriggerAddModal(false)}
          existingSchoolIds={rows.map((r) => r.schools.id)}
          existingAcceptanceRates={rows.map((r) => r.schools.acceptance_rate).filter((r): r is number => r !== null)}
          onExplore={(school) => { setExploreSchool(school); setExploreFromSearch(true); setExplorePanelOpen(true); }}
          hideForExplore={explorePanelOpen && exploreFromSearch}
        />
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <button
            onClick={() => setTriggerAddModal(true)}
            className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl mb-5 transition-transform hover:scale-110 active:scale-95"
            style={{ backgroundColor: "var(--cr-brand-bg)" }}
          >
            <PlusIcon className="w-8 h-8" style={{ color: "var(--cr-brand)" }} />
          </button>
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--cr-text)" }}>Your list is empty</h3>
          <p className="text-sm max-w-xs" style={{ color: "var(--cr-text-muted)" }}>
            Click the button above or &quot;+ Add School&quot; to get started.
          </p>
        </div>
      )}

      {/* Mobile card list */}
      {rows.length > 0 && (
        <div className="md:hidden rounded-xl border overflow-hidden mb-4" style={{ borderColor: "var(--cr-border)" }}>
          {filtered.map((row) => (
            <MobileSchoolCard
              key={row.id}
              row={row}
              onOpen={openPanel}
              onRemove={removeSchool}
              attainabilityColors={attainabilityColors}
              logoError={logoErrors.has(row.id)}
              onLogoError={(id) => setLogoErrors((prev) => new Set(prev).add(id))}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--cr-text-faint)" }}>No schools match this filter.</p>
          )}
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="hidden md:block">
        <div className="relative">
          {showDetailHint && <DetailHintCallout onDismiss={dismissDetailHint} />}
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--cr-border)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--cr-border)", backgroundColor: "var(--cr-subtle-bg)" }}>
                {anyFavorited && (
                  <th className="sticky left-0 z-10" style={{ backgroundColor: "var(--cr-subtle-bg)", width: "24px", minWidth: "24px", padding: 0 }} />
                )}
                <th className={`sticky z-10 ${HEADER_CELL_CLASS}`} style={{ left: anyFavorited ? "24px" : 0, color: "var(--cr-text-muted)", backgroundColor: "var(--cr-subtle-bg)", minWidth: "200px", maxWidth: "200px", width: "200px" }}>
                  <ColHeader icon={AcademicCapIcon} label="School" />
                </th>
                <th style={{ backgroundColor: "var(--cr-subtle-bg)", width: "1px", padding: 0 }} />
                {col("attainability") && (
                  <th className={HEADER_CELL_CLASS} style={{ color: "var(--cr-text-muted)" }}>
                    <span className="inline-flex items-center">
                      <ColHeader icon={AdjustmentsHorizontalIcon} label="Fit" />
                      <FitInfoTooltip />
                    </span>
                  </th>
                )}
                {col("location") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={MapPinIcon} label="Location" />
                  </th>
                )}
                {col("type") && (
                  <th className={HEADER_CELL_CLASS} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={BuildingOfficeIcon} label="Type" />
                  </th>
                )}
                {col("setting") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={MapIcon} label="Setting" />
                  </th>
                )}
                {col("enrollment") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={UsersIcon} label="Size" />
                  </th>
                )}
                {col("acceptance_rate") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={PercentBadgeIcon} label="Acceptance" />
                  </th>
                )}
                {col("sat_range") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={PencilSquareIcon} label="SAT Range" />
                  </th>
                )}
                {col("test_policy") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={ClipboardDocumentCheckIcon} label="Test Policy" />
                  </th>
                )}
                {col("net_tuition") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={CurrencyDollarIcon} label="Tuition" />
                  </th>
                )}
                {col("app_type") && (
                  <th className={`${HEADER_CELL_CLASS} whitespace-nowrap`} style={{ color: "var(--cr-text-muted)" }}>
                    <span className="inline-flex items-center">
                      <ColHeader icon={CalendarDaysIcon} label="App Type" />
                      <AppTypeInfoTooltip />
                    </span>
                  </th>
                )}
                {col("status") && (
                  <th className={HEADER_CELL_CLASS} style={{ color: "var(--cr-text-muted)" }}>
                    <ColHeader icon={FlagIcon} label="Status" />
                  </th>
                )}
                {col("notes") && (
                  <th className={HEADER_CELL_CLASS} style={{ color: "var(--cr-text-muted)", minWidth: "160px" }}>
                    <ColHeader icon={ChatBubbleLeftEllipsisIcon} label="Notes" />
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const rowBaseColor = colorRows && row.attainability
                  ? COLOR_PALETTE[attainabilityColors[row.attainability]].rowBg
                  : "var(--cr-card-bg)";
                const rowHoverColor = colorRows && row.attainability
                  ? COLOR_PALETTE[attainabilityColors[row.attainability]].rowHover
                  : "var(--cr-table-row-hover)";
                return (
                <tr
                  key={row.id}
                  className="border-b group tr-hoverable"
                  style={{
                    "--row-hover-bg": rowHoverColor,
                    borderColor: i === filtered.length - 1 ? "transparent" : "var(--cr-border)",
                    backgroundColor: rowBaseColor,
                  } as React.CSSProperties}
                >
                  {/* Favorite star indicator (non-clickable, only shown when anyFavorited) */}
                  {anyFavorited && (
                    <td className="sticky left-0 z-10 align-middle" style={{ backgroundColor: rowBaseColor, width: "24px", minWidth: "24px", padding: "0 0 0 6px" }}>
                      {row.is_favorite && (
                        <StarIconSolid className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F59E0B", pointerEvents: "none" }} />
                      )}
                    </td>
                  )}
                  {/* School name (sticky) */}
                  <td className="sticky z-10 pl-4 pr-2 py-1.5 align-middle" style={{ left: anyFavorited ? "24px" : 0, backgroundColor: rowBaseColor, maxWidth: "200px", width: "200px" }}>
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
                        <div className="w-[18px] h-[18px] rounded-sm flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--cr-subtle-bg)" }}>
                          <AcademicCapIcon className="w-3 h-3" style={{ color: "var(--cr-text-disabled)" }} />
                        </div>
                      )}
                      <button
                        onClick={() => openPanel(row)}
                        className="text-left text-sm font-medium hover:underline underline-offset-2 transition-colors flex-1 truncate min-w-0"
                        style={{ color: "var(--cr-text)" }}
                        title={row.schools.name}
                      >
                        {displayName(row.schools.name)}
                      </button>
                    </div>
                  </td>
                  {/* Explore + trash + star (not sticky) */}
                  <td className="py-1.5 pr-1 align-middle whitespace-nowrap" style={{ width: "1px" }}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPanel(row)}
                        title="Explore school"
                        className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md transition-colors"
                        style={{ color: "var(--cr-text-muted)", backgroundColor: "var(--cr-subtle-bg)", border: "1px solid var(--cr-border)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--cr-border)"; e.currentTarget.style.color = "var(--cr-text-body)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--cr-subtle-bg)"; e.currentTarget.style.color = "var(--cr-text-muted)"; }}
                      >
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        Explore
                      </button>
                      <button
                        onClick={() => removeSchool(row.id)}
                        title="Remove school"
                        className="p-0.5 rounded hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--cr-text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cr-text-muted)")}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                      {/* Star / unstar button */}
                      <div className="relative">
                        <button
                          onClick={() => toggleFavorite(row.id)}
                          title={row.is_favorite ? "Unstar" : "Star this school"}
                          className="p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: row.is_favorite ? "#F59E0B" : "var(--cr-text-muted)" }}
                          onMouseEnter={(e) => { if (!row.is_favorite) e.currentTarget.style.color = "#F59E0B"; }}
                          onMouseLeave={(e) => { if (!row.is_favorite) e.currentTarget.style.color = "var(--cr-text-muted)"; }}
                        >
                          {row.is_favorite
                            ? <StarSlashIcon className="w-3.5 h-3.5" />
                            : <StarIcon className="w-3.5 h-3.5" />
                          }
                        </button>
                        {/* Cap toast */}
                        {favCapToast === row.id && (
                          <div
                            className="absolute z-50 whitespace-nowrap rounded-md px-2 py-1 text-xs"
                            style={{
                              top: "calc(100% + 4px)",
                              right: 0,
                              backgroundColor: "var(--cr-card-bg)",
                              border: "1px solid var(--cr-border)",
                              color: "var(--cr-text-muted)",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              pointerEvents: "none",
                            }}
                          >
                            Max 3 stars
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {col("attainability") && (
                    <td className={BODY_CONTROL_CELL_CLASS} style={{ paddingLeft: "6px" }}>
                      <StyledSelect
                        value={row.attainability ?? ""}
                        onChange={(val) => {
                          const v = val as Attainability | "";
                          updateField(row.id, { attainability: v === "" ? null : v as Attainability });
                        }}
                        options={ATTAINABILITIES.map((a) => ({ value: a, label: a === "" ? "Set fit…" : a }))}
                        className={`${PILL_SELECT_CLASS} ${row.attainability ? "" : "bg-stone-100 text-stone-400 border-stone-200 dark:bg-stone-800 dark:text-stone-500 dark:border-stone-700"}`}
                        style={row.attainability ? getAttainabilityStyle(row.attainability, attainabilityColors) : undefined}
                      />
                    </td>
                  )}

                  {col("location") && (
                    <td className={BODY_CELL_NOWRAP_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {row.schools.city && row.schools.state ? `${row.schools.city}, ${row.schools.state}` : "—"}
                    </td>
                  )}

                  {col("type") && (
                    <td className={BODY_CELL_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {row.schools.school_type ?? "—"}
                    </td>
                  )}

                  {col("setting") && (
                    <td className={BODY_CELL_NOWRAP_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {row.schools.setting ?? "—"}
                    </td>
                  )}

                  {col("enrollment") && (
                    <td className={BODY_CELL_NOWRAP_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {formatEnrollment(row.schools.enrollment)}
                    </td>
                  )}

                  {col("acceptance_rate") && (
                    <td className={BODY_CELL_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {formatAcceptance(row.schools.acceptance_rate)}
                    </td>
                  )}

                  {col("sat_range") && (
                    <td className={BODY_CELL_NOWRAP_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {formatSAT(row.schools.sat_25th, row.schools.sat_75th)}
                    </td>
                  )}

                  {col("test_policy") && (
                    <td className={BODY_CELL_NOWRAP_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {row.schools.test_policy === "Considered but not Required" ? "Optional"
                        : row.schools.test_policy === "Neither Required nor Recommended" ? "Test-Free"
                        : row.schools.test_policy ?? "—"}
                    </td>
                  )}

                  {col("net_tuition") && (
                    <td className={BODY_CELL_NOWRAP_CLASS} style={{ color: "var(--cr-text-body)" }}>
                      {formatPrice(row.schools.tuition_out_of_state)}
                    </td>
                  )}

                  {col("app_type") && (
                    <td className={BODY_CONTROL_CELL_CLASS}>
                      <StyledSelect
                        value={row.app_type}
                        onChange={(val) => updateField(row.id, { app_type: val as AppType })}
                        options={APP_TYPES.map((t) => ({ value: t, label: t }))}
                        className={`${APP_TYPE_SELECT_CLASS} ${APP_TYPE_STYLES[row.app_type]} ${row.app_type === "Undecided" ? "!w-[90px]" : ""}`}
                      />
                    </td>
                  )}

                  {col("status") && (
                    <td className={BODY_CONTROL_CELL_CLASS} style={{ paddingLeft: "6px" }}>
                      <StyledSelect
                        value={row.status}
                        onChange={(val) => updateField(row.id, { status: val as Status })}
                        options={STATUSES.map((s) => ({ value: s, label: s }))}
                        className={`${PILL_SELECT_CLASS} ${STATUS_STYLES[row.status]}`}
                      />
                    </td>
                  )}

                  {col("notes") && (
                    <td className={BODY_CONTROL_CELL_CLASS}>
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
                          style={{ borderColor: "var(--cr-brand)", color: "var(--cr-text)" }}
                          placeholder="Add a note..."
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingNotes(row.id); setNotesValue(row.notes ?? ""); }}
                          className="text-xs text-left w-full truncate max-w-[200px] transition-colors"
                          style={{ color: row.notes ? "var(--cr-text)" : "var(--cr-text-disabled)" }}
                        >
                          {row.notes || "Add a note..."}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        </div>
        </div>
      )}

      <SchoolDetailPanel
        row={selectedRow}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onNotesChange={(id, notes) => updateField(id, { notes } as Partial<UserSchoolRow>)}
        isFavorite={selectedRow?.is_favorite ?? false}
      />
      <SchoolDetailPanel
        open={explorePanelOpen}
        onClose={() => setExplorePanelOpen(false)}
        mode="explore"
        exploreSchool={exploreSchool}
        isOnList={exploreSchool ? rows.some((r) => r.schools.id === exploreSchool.id) : false}
        onBack={() => {
          setExplorePanelOpen(false);
          setExploreFromSearch(false);
        }}
        onAddToList={async (school) => {
          const res = await fetch("/api/schools/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(school),
          });
          const data = await res.json();
          if (res.ok) {
            handleSchoolAdded({ ...data.userSchool, schools: data.school });
          }
        }}
      />
    </div>
  );
}
