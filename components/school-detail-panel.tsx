"use client";

import { useEffect, useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  XMarkIcon,
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import {
  buildEssayRequirementsViewModel,
  EssayRequirementSummaryRow,
  StructuredEssayPromptRow,
  EssayRequirementsViewModel,
} from "@/lib/essay-requirements";
import { buildCdsViewModel, CdsDataRow, CdsViewModel, ADMISSION_FACTOR_LABELS, sanitizeCdsDataRow } from "@/lib/cds-data";
import MapGL, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

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
  attainability: string | null;
  app_type: string;
  status: string;
  notes: string | null;
  added_at: string;
  schools: School;
}

interface SchoolDetailPanelProps {
  row?: UserSchoolRow | null;
  open: boolean;
  onClose: () => void;
  onNotesChange?: (id: string, notes: string) => void;
  mode?: "list" | "explore";
  exploreSchool?: School | null;
  onAddToList?: (school: School) => void;
  onBack?: () => void;
  isOnList?: boolean;
  isFavorite?: boolean;
  canFavorite?: boolean;
  onToggleFavorite?: () => void;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, prefix = "", suffix = "", decimals = 0) {
  if (n == null) return "—";
  return `${prefix}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

// ── Small components ──────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: "var(--cr-subtle-bg)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--cr-text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "var(--cr-text)" }}>
        {value}
      </p>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex" style={{ verticalAlign: "middle" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex-shrink-0 transition-opacity"
        style={{ opacity: open ? 1 : 0.45, lineHeight: 0 }}
        aria-label="More info"
      >
        {/* Standard info circle SVG */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7.25" stroke="var(--cr-brand)" strokeWidth="1.5"/>
          <circle cx="8" cy="5.5" r="1" fill="var(--cr-brand)"/>
          <rect x="7.25" y="7.5" width="1.5" height="4" rx="0.75" fill="var(--cr-brand)"/>
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-50 rounded-lg shadow-lg p-3 text-xs leading-relaxed"
          style={{
            backgroundColor: "#1E293B",
            color: "#E2E8F0",
            width: "240px",
            left: "50%",
            top: "calc(100% + 8px)",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          {text}
          <div style={{
            position: "absolute",
            top: "-5px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderBottom: "5px solid #1E293B",
          }} />
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-base font-semibold" style={{ color: "var(--cr-text)" }}>
        {children}
      </h3>
      {info && <InfoTooltip text={info} />}
    </div>
  );
}

function NoData() {
  return (
    <p className="text-sm py-10 text-center" style={{ color: "var(--cr-text-muted)" }}>
      Data coming soon
    </p>
  );
}

function SchoolMap({ lat, lon }: { lat: number; lon: number }) {
  const { resolvedTheme } = useTheme();
  const mapStyle = resolvedTheme === "dark"
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
  return (
    <div className="rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: "var(--cr-border)", height: "160px" }}>
      <MapGL
        key={`${lat},${lon}`}
        initialViewState={{ longitude: lon, latitude: lat, zoom: 12 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        interactive={false}
        attributionControl={false}
      >
        <Marker longitude={lon} latitude={lat} anchor="bottom">
          <div
            className="w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: "var(--cr-brand)", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
          />
        </Marker>
      </MapGL>
    </div>
  );
}

// ── Tab: Essays ───────────────────────────────────────────────────────────────

function EssayPanel({ vm, loading }: { vm: EssayRequirementsViewModel; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5 py-4">
        <div className="w-4 h-4 border-2 border-stone-200 border-t-blue-900 rounded-full animate-spin flex-shrink-0" />
        <span className="text-sm" style={{ color: "var(--cr-text-muted)" }}>Loading essay prompts…</span>
      </div>
    );
  }

  const prompts = vm.mode === "rich" ? null : vm.legacyPrompts;
  const sections = vm.mode === "rich" ? vm.sections : null;
  const summary = vm.mode === "rich" ? vm.summary : null;
  const isEmpty = vm.legacyPrompts.length === 0 && vm.sections.length === 0;

  if (isEmpty) {
    return <p className="text-sm mt-1" style={{ color: "var(--cr-text-muted)" }}>No supplemental essays required for this school.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-3" style={{ color: "var(--cr-text)" }}>{vm.title}</h2>
      {summary && (
        <div className="mb-5 space-y-1">
          {summary.applicationType && (
            <p className="text-sm" style={{ color: "var(--cr-text)" }}>
              <span className="font-semibold">Application Type:</span> {summary.applicationType}
            </p>
          )}
          {summary.essayCountSummary && (
            <p className="text-sm" style={{ color: "var(--cr-text)" }}>
              <span className="font-semibold">Number of Essays:</span> {summary.essayCountSummary}
            </p>
          )}
          {summary.wordLimitSummary && (
            <p className="text-sm" style={{ color: "var(--cr-text)" }}>
              <span className="font-semibold">Word Limit:</span> {summary.wordLimitSummary}
            </p>
          )}
        </div>
      )}
      {sections && sections.map((section) => (
        <div key={section.key} className="mb-6">
          <h3 className="text-base font-bold mb-3" style={{ color: "var(--cr-text)" }}>{section.title}</h3>
          {section.displayStyle === "numbered_list" ? (
            <ol className="list-decimal list-outside ml-5 space-y-2">
              {section.prompts.map((p) => (
                <li key={p.id} className="text-sm leading-relaxed pl-1" style={{ color: "var(--cr-text)" }}>{p.promptText}</li>
              ))}
            </ol>
          ) : (
            <div className="space-y-4">
              {section.prompts.map((p) => (
                <div key={p.id}>
                  {p.promptTitle && <p className="text-sm font-semibold mb-1" style={{ color: "var(--cr-text)" }}>{p.promptTitle}</p>}
                  <p className="text-sm leading-relaxed" style={{ color: "var(--cr-text-body)" }}>{p.promptText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {prompts && (
        <ol className="list-decimal list-outside ml-5 space-y-3">
          {prompts.map((p) => (
            <li key={p.id} className="text-sm leading-relaxed pl-1" style={{ color: "var(--cr-text)" }}>
              {p.promptText}
              {p.wordLimit != null && (
                <span className="ml-2 text-[11px]" style={{ color: "var(--cr-text-muted)" }}>({p.wordLimit} words)</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Application Funnel (stacked cards) ───────────────────────────────────────

function ApplicationFunnelChart({ vm }: { vm: CdsViewModel }) {
  const { applicants, admitted, enrolled } = vm.funnel!;
  const rejected  = applicants - admitted;
  const declined  = enrolled ? admitted - enrolled : null;

  const admitPct   = (admitted / applicants) * 100;
  const rejectPct  = (rejected / applicants) * 100;
  const yieldNum   = enrolled && admitted > 0 ? (enrolled / admitted) * 100 : null;
  const declinePct = declined && admitted > 0 ? (declined / admitted) * 100 : null;

  const acceptLbl = vm.acceptanceRate ?? `${admitPct.toFixed(1)}%`;
  const yieldLbl  = vm.yieldRate ?? (yieldNum ? `${yieldNum.toFixed(0)}%` : null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Applied */}
      <FunnelCard
        label="Applied"
        count={applicants}
        bg="var(--cr-subtle-bg)"
        border="var(--cr-border)"
        countColor="var(--cr-text)"
      />

      {/* Connector 1 */}
      <FunnelConnector
        passPct={acceptLbl}
        passLabel="acceptance rate"
        rejectCount={rejected}
        rejectPct={`${rejectPct.toFixed(1)}%`}
        rejectLabel="rejected"
      />

      {/* Admitted */}
      <FunnelCard
        label="Admitted"
        count={admitted}
        bg="var(--cr-brand-bg)"
        border="var(--cr-pill-blue-border)"
        countColor="var(--cr-brand)"
      />

      {enrolled && yieldLbl && (
        <>
          {/* Connector 2 */}
          <FunnelConnector
            passPct={yieldLbl}
            passLabel="yield rate"
            rejectCount={declined}
            rejectPct={declinePct ? `${declinePct.toFixed(1)}%` : null}
            rejectLabel="declined"
          />

          {/* Enrolled */}
          <FunnelCard
            label="Enrolled"
            count={enrolled}
            bg="var(--cr-pill-blue-bg)"
            border="var(--cr-pill-blue-border)"
            countColor="var(--cr-brand)"
          />
        </>
      )}
    </div>
  );
}

function FunnelCard({
  label, count, bg, border, countColor,
}: {
  label: string; count: number; bg: string; border: string; countColor: string;
}) {
  return (
    <div style={{
      borderRadius: "8px",
      border: `1.5px solid ${border}`,
      backgroundColor: bg,
      padding: "8px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div>
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.09em", color: "var(--cr-text-faint)", textTransform: "uppercase", marginBottom: "2px" }}>
          {label}
        </p>
        <p style={{ fontSize: "18px", fontWeight: 800, color: countColor, lineHeight: 1 }}>
          {count.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function FunnelConnector({
  passPct, passLabel, rejectCount, rejectPct, rejectLabel,
}: {
  passPct: string; passLabel: string;
  rejectCount: number | null; rejectPct: string | null; rejectLabel: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "4px 0 4px 16px", gap: "8px" }}>
      {/* vertical tick */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "12px", flexShrink: 0 }}>
        <div style={{ width: "1.5px", height: "100%", backgroundColor: "var(--cr-pill-blue-border)", flex: 1 }} />
      </div>
      {/* labels */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--cr-brand)" }}>
          {passPct}
        </span>
        <span style={{ fontSize: "11px", color: "var(--cr-text-faint)" }}>{passLabel}</span>
        {rejectCount !== null && rejectCount > 0 && (
          <>
            <span style={{ fontSize: "11px", color: "var(--cr-text-disabled)" }}>·</span>
            <span style={{ fontSize: "11px", color: "var(--cr-text-faint)" }}>
              {rejectCount.toLocaleString()} {rejectLabel}
              {rejectPct ? <span style={{ color: "var(--cr-text-disabled)" }}> ({rejectPct})</span> : null}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab: Admissions ───────────────────────────────────────────────────────────

const FACTOR_TIER_CONFIG: Record<string, { width: string; color: string; dotColor: string }> = {
  "Very Important": { width: "100%", color: "var(--cr-brand)", dotColor: "var(--cr-brand)" },
  "Important":      { width: "67%",  color: "#3B82F6", dotColor: "#3B82F6" },
  "Considered":     { width: "33%",  color: "#BFDBFE", dotColor: "#93C5FD" },
  "Not Considered": { width: "0%",   color: "#E5E7EB", dotColor: "#D1D5DB" },
};

const TIER_ORDER = ["Very Important", "Important", "Considered", "Not Considered"];

function AdmissionsTab({ vm, school }: { vm: CdsViewModel; school: School }) {
  const hasAnyData = vm.hasData || school.acceptance_rate !== null || school.sat_25th !== null;
  if (!hasAnyData) return <NoData />;

  // Acceptance rate as a number (0–100)
  const rateNum = vm.acceptanceRate
    ? parseFloat(vm.acceptanceRate)
    : school.acceptance_rate !== null
    ? school.acceptance_rate * 100
    : null;

  // Build flat factor list from raw admission_factors data via admissionFactors groups
  const factorTierMap: Record<string, string> = {};
  for (const group of vm.admissionFactors) {
    for (const factorLabel of group.factors) {
      factorTierMap[factorLabel] = group.tier;
    }
  }
  // Also check if "Not Considered" factors exist by scanning ADMISSION_FACTOR_LABELS
  // We only show factors that appear in any tier group
  const flatFactors = Object.values(ADMISSION_FACTOR_LABELS)
    .map(label => ({ label, tier: factorTierMap[label] ?? null }))
    .filter(f => f.tier !== null)
    .sort((a, b) => TIER_ORDER.indexOf(a.tier!) - TIER_ORDER.indexOf(b.tier!));

  // Donut config
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  const fillArc = rateNum !== null ? Math.max(2, (rateNum / 100) * CIRC) : 0;

  // SAT data
  const satLow  = vm.satCompositeRange?.low  ?? school.sat_25th ?? null;
  const satHigh = vm.satCompositeRange?.high ?? school.sat_75th ?? null;
  const satMid  = vm.satCompositeRange?.midpoint ?? (satLow !== null && satHigh !== null ? Math.round((satLow + satHigh) / 2) : null);
  const hasSat  = satLow !== null || vm.satRange !== null;

  // ACT data
  const actParts = vm.actRange ? vm.actRange.split(/\s*–\s*/) : null;
  const actLow  = actParts ? parseInt(actParts[0]) : null;
  const actHigh = actParts ? parseInt(actParts[1]) : null;
  const actMid  = vm.actMidpoint ?? (actLow !== null && actHigh !== null ? Math.round((actLow + actHigh) / 2) : null);

  const hasGpa     = !!(vm.gpaAverage || vm.gpaDistribution.length > 0);
  const hasTests   = hasSat || !!vm.actRange;
  const hasFunnel  = !!vm.funnel;
  const hasFactors = flatFactors.length > 0;
  const hasEarly   = !!(vm.earlyPrograms.ea || vm.earlyPrograms.ed);
  const totalUndergrad = vm.totalUndergraduates ?? school.enrollment;

  return (
    <div className="space-y-3">

      {/* ── Row 1: Acceptance Rate + Funnel ── */}
      {(rateNum !== null || hasFunnel) && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>

          {rateNum !== null && (
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--cr-border)" }}>
              <SectionHeading info="The percentage of applicants offered admission. A lower rate means more selective. This is based on the most recent Common Data Set filing.">Acceptance Rate</SectionHeading>
              <div className="flex items-center justify-between">
                <div>
                  {totalUndergrad !== null && (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--cr-brand)" }} />
                        <span className="text-xs" style={{ color: "var(--cr-text-muted)" }}>Undergraduates</span>
                      </div>
                      <p className="text-xl font-bold" style={{ color: "var(--cr-text)" }}>
                        {totalUndergrad.toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
                <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
                  <svg width="88" height="88" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={R} fill="none" stroke="var(--cr-border)" strokeWidth="10" />
                    <circle cx="50" cy="50" r={R} fill="none" stroke="var(--cr-brand)" strokeWidth="10"
                      strokeDasharray={`${fillArc} ${CIRC}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: "var(--cr-text)" }}>
                      {rateNum < 1 ? rateNum.toFixed(1) : Math.round(rateNum)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasFunnel && (
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--cr-border)" }}>
              <SectionHeading info="Shows how many students applied, how many were admitted, and how many ultimately enrolled. The yield rate is the % of admitted students who chose to attend.">Application Funnel</SectionHeading>
              <ApplicationFunnelChart vm={vm} />
            </div>
          )}
        </div>
      )}

      {/* ── Row 2: GPA + Test Scores ── */}
      {(hasGpa || hasTests) && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>

          {hasGpa && (
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--cr-border)" }}>
              <SectionHeading info="Breakdown of the unweighted high school GPAs of recently admitted students. Gives you a sense of where your GPA falls relative to the admitted class.">GPA Distribution</SectionHeading>
              {vm.gpaAverage && (
                <div className="mb-3">
                  <span className="text-xs" style={{ color: "var(--cr-text-muted)" }}>Avg unweighted </span>
                  <span className="text-2xl font-bold" style={{ color: "var(--cr-text)" }}>{vm.gpaAverage.value}</span>
                  {vm.gpaAverage.source === "estimated" && (
                    <span className="ml-1 align-middle text-[10px]" style={{ color: "var(--cr-text-muted)" }}>(estimated)</span>
                  )}
                </div>
              )}
              {vm.gpaDistribution.length > 0 && (
                <div className="flex items-end gap-2" style={{ height: "80px" }}>
                  {vm.gpaDistribution.map(({ label, pct }) => (
                    <div key={label} className="flex flex-col items-center flex-1 h-full justify-end">
                      <span className="text-[9px] font-medium mb-0.5" style={{ color: "var(--cr-text-body)" }}>{Math.round(pct)}%</span>
                      <div className="w-full rounded-t-sm" style={{
                        height: `${Math.max(2, pct)}%`,
                        backgroundColor: pct >= 30 ? "var(--cr-brand)" : pct >= 10 ? "#3B82F6" : "#BFDBFE",
                      }} />
                      <span className="text-[8px] mt-1 text-center leading-tight" style={{ color: "var(--cr-text-muted)" }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasTests && (
            <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--cr-border)" }}>
              <SectionHeading info="The 25th–75th percentile SAT/ACT scores of enrolled students. The middle number is the midpoint. Scoring above the 75th percentile makes you a strong candidate; below the 25th means tests may be a weakness in your application.">Test Scores</SectionHeading>

              {hasSat && satLow !== null && satHigh !== null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: "var(--cr-text)" }}>SAT </span>
                      <span className="text-xs" style={{ color: "var(--cr-text-muted)" }}>{satLow.toLocaleString()} – {satHigh.toLocaleString()}</span>
                    </div>
                    {satMid !== null && <span className="text-lg font-bold" style={{ color: "var(--cr-text)" }}>{satMid.toLocaleString()}</span>}
                  </div>
                  <div className="relative h-1.5 rounded-full" style={{ backgroundColor: "var(--cr-border)" }}>
                    <div className="absolute h-1.5 rounded-full" style={{
                      left: `${(satLow / 1600) * 100}%`,
                      width: `${((satHigh - satLow) / 1600) * 100}%`,
                      backgroundColor: "var(--cr-brand)",
                    }} />
                  </div>
                  {vm.testSubmitPct && <p className="text-[10px] mt-1" style={{ color: "var(--cr-text-muted)" }}>{vm.testSubmitPct}</p>}
                </div>
              )}

              {actLow !== null && actHigh !== null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: "var(--cr-text)" }}>ACT </span>
                      <span className="text-xs" style={{ color: "var(--cr-text-muted)" }}>{actLow} – {actHigh}</span>
                    </div>
                    {actMid !== null && <span className="text-lg font-bold" style={{ color: "var(--cr-text)" }}>{actMid}</span>}
                  </div>
                  <div className="relative h-1.5 rounded-full" style={{ backgroundColor: "var(--cr-border)" }}>
                    <div className="absolute h-1.5 rounded-full" style={{
                      left: `${(actLow / 36) * 100}%`,
                      width: `${((actHigh - actLow) / 36) * 100}%`,
                      backgroundColor: "#F59E0B",
                    }} />
                  </div>
                </div>
              )}

              {school.test_policy && (
                <p className="text-xs" style={{ color: "var(--cr-text-muted)" }}>Policy: <span style={{ color: "var(--cr-text)", fontWeight: 600 }}>{school.test_policy}</span></p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Row 3: Admission Factors (full width) ── */}
      {hasFactors && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--cr-border)" }}>
          <SectionHeading info="How much weight the admissions office places on each factor. 'Very Important' factors can make or break an application; 'Considered' ones are nice to have but won't define your candidacy.">Admission Factors</SectionHeading>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
            {Object.entries(FACTOR_TIER_CONFIG).map(([tier, { dotColor }]) => (
              <span key={tier} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--cr-text-muted)" }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                {tier}
              </span>
            ))}
          </div>
          <div className="grid gap-x-8 gap-y-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {flatFactors.map(({ label, tier }) => {
              const cfg = FACTOR_TIER_CONFIG[tier!] ?? FACTOR_TIER_CONFIG["Not Considered"];
              const displayLabel = label === "Character / Personal Qualities" ? "Character / Qualities" : label;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs flex-shrink-0 text-right whitespace-nowrap" style={{ color: "var(--cr-text-body)", width: "140px" }}>{displayLabel}</span>
                  <div className="rounded-full overflow-hidden h-1.5" style={{ backgroundColor: "var(--cr-subtle-bg)", width: "120px" }}>
                    {cfg.width !== "0%" && (
                      <div className="h-1.5 rounded-full" style={{ width: cfg.width, backgroundColor: cfg.color }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Row 4: Early Programs ── */}
      {hasEarly && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--cr-border)" }}>
          <SectionHeading info="Early Action (EA) is non-binding — you apply early and hear back sooner, but aren't required to attend. Early Decision (ED) is binding — if admitted, you're committed to enroll. ED often has higher acceptance rates.">Early Programs</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {vm.earlyPrograms.ea && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={vm.earlyPrograms.ea.offered
                  ? { backgroundColor: "var(--cr-brand-bg)", color: "var(--cr-brand)" }
                  : { backgroundColor: "var(--cr-tag-bg)", color: "var(--cr-text-muted)" }}>
                EA {vm.earlyPrograms.ea.offered
                  ? (vm.earlyPrograms.ea.deadline ? `· ${vm.earlyPrograms.ea.deadline}` : "· Offered")
                  : "· Not Offered"}
              </div>
            )}
            {vm.earlyPrograms.ed && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={vm.earlyPrograms.ed.offered
                  ? { backgroundColor: "var(--cr-pill-amber-bg)", color: "var(--cr-pill-amber-text)" }
                  : { backgroundColor: "var(--cr-tag-bg)", color: "var(--cr-text-muted)" }}>
                ED {vm.earlyPrograms.ed.offered
                  ? (vm.earlyPrograms.ed.deadline ? `· ${vm.earlyPrograms.ed.deadline}` : "· Offered")
                  : "· Not Offered"}
              </div>
            )}
          </div>
        </div>
      )}

      {!vm.hasData && <NoData />}

      {vm.cdsYear && (
        <p className="text-[10px]" style={{ color: "var(--cr-text-faint)" }}>
          Source: Common Data Set {vm.cdsYear}–{String(vm.cdsYear + 1).slice(2)}
        </p>
      )}
    </div>
  );
}

// ── Tab: Costs & Aid ──────────────────────────────────────────────────────────

function CostsAidTab({ vm, school }: { vm: CdsViewModel; school: School }) {
  const isPublic = school.school_type === "Public";
  const fees = vm.costBreakdown?.fees ?? null;
  const roomBoard = vm.costBreakdown?.roomBoard ?? null;

  // Out-of-state amounts
  const tuitionOut = school.tuition_out_of_state ?? null;
  const tuitionIn  = school.tuition_in_state ?? null;

  const totalOut = (() => {
    const t = tuitionOut ?? tuitionIn;
    if (t === null) return null;
    const components = [t, fees, roomBoard].filter(v => v !== null) as number[];
    return components.length >= 1 ? components.reduce((a, b) => a + b, 0) : null;
  })();

  const totalIn = isPublic && tuitionIn !== null ? (() => {
    const components = [tuitionIn, fees, roomBoard].filter(v => v !== null) as number[];
    return components.length >= 1 ? components.reduce((a, b) => a + b, 0) : null;
  })() : null;

  const hasAnyCost = tuitionOut !== null || tuitionIn !== null || fees !== null || roomBoard !== null;
  const hasAnyAid = vm.pctNeedMet || vm.avgFinancialAidPackage || vm.avgNeedGrant || vm.avgNeedBasedAid || vm.pctReceivingAid || school.net_price;

  if (!hasAnyCost && !hasAnyAid) return <NoData />;

  return (
    <div className="space-y-7">
      {/* Cost of Attendance */}
      {hasAnyCost && (
        <div>
          <SectionHeading info="The full estimated annual cost before financial aid. Includes tuition, required fees, and room & board. Most students pay significantly less after grants and scholarships.">Cost of Attendance</SectionHeading>

          {isPublic && tuitionIn !== null && tuitionOut !== null ? (
            /* Public school: 2-column table */
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--cr-border)" }}>
              {/* Header */}
              <div className="grid border-b" style={{ gridTemplateColumns: "1fr 1fr 1fr", borderColor: "var(--cr-border)", backgroundColor: "var(--cr-subtle-bg)" }}>
                <div className="px-4 py-2" />
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: "var(--cr-text-muted)" }}>In State</div>
                <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: "var(--cr-text-muted)" }}>Out of State</div>
              </div>
              {/* Tuition row */}
              <div className="grid border-b" style={{ gridTemplateColumns: "1fr 1fr 1fr", borderColor: "var(--cr-border)" }}>
                <div className="px-4 py-2.5 text-sm" style={{ color: "var(--cr-text-body)" }}>Tuition</div>
                <div className="px-4 py-2.5 text-sm font-medium text-center" style={{ color: "var(--cr-text)" }}>{fmt(tuitionIn, "$")}</div>
                <div className="px-4 py-2.5 text-sm font-medium text-center" style={{ color: "var(--cr-text)" }}>{fmt(tuitionOut, "$")}</div>
              </div>
              {/* Fees */}
              {fees !== null && (
                <div className="grid border-b" style={{ gridTemplateColumns: "1fr 1fr 1fr", borderColor: "var(--cr-border)" }}>
                  <div className="px-4 py-2.5 text-sm" style={{ color: "var(--cr-text-body)" }}>Required Fees</div>
                  <div className="px-4 py-2.5 text-sm font-medium text-center" style={{ color: "var(--cr-text)" }}>{fmt(fees, "$")}</div>
                  <div className="px-4 py-2.5 text-sm font-medium text-center" style={{ color: "var(--cr-text)" }}>{fmt(fees, "$")}</div>
                </div>
              )}
              {/* Room & Board */}
              {roomBoard !== null && (
                <div className="grid border-b" style={{ gridTemplateColumns: "1fr 1fr 1fr", borderColor: "var(--cr-border)" }}>
                  <div className="px-4 py-2.5 text-sm" style={{ color: "var(--cr-text-body)" }}>Room & Board</div>
                  <div className="px-4 py-2.5 text-sm font-medium text-center" style={{ color: "var(--cr-text)" }}>{fmt(roomBoard, "$")}</div>
                  <div className="px-4 py-2.5 text-sm font-medium text-center" style={{ color: "var(--cr-text)" }}>{fmt(roomBoard, "$")}</div>
                </div>
              )}
              {/* Totals */}
              {(totalIn !== null || totalOut !== null) && (
                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", backgroundColor: "var(--cr-subtle-bg)" }}>
                  <div className="px-4 py-2.5 text-sm font-semibold" style={{ color: "var(--cr-text)" }}>Estimated Total</div>
                  <div className="px-4 py-2.5 text-sm font-semibold text-center" style={{ color: "var(--cr-brand)" }}>{totalIn !== null ? fmt(totalIn, "$") : "—"}</div>
                  <div className="px-4 py-2.5 text-sm font-semibold text-center" style={{ color: "var(--cr-brand)" }}>{totalOut !== null ? fmt(totalOut, "$") : "—"}</div>
                </div>
              )}
            </div>
          ) : (
            /* Private school: single column */
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--cr-border)" }}>
              {[
                { label: "Tuition", value: tuitionOut ?? tuitionIn },
                { label: "Required Fees", value: fees },
                { label: "Room & Board", value: roomBoard },
              ]
                .filter(r => r.value !== null)
                .map((row, i) => (
                  <div key={row.label} className={`flex justify-between px-4 py-2.5 text-sm ${i > 0 ? "border-t" : ""}`}
                    style={{ borderColor: "var(--cr-border)" }}>
                    <span style={{ color: "var(--cr-text-body)" }}>{row.label}</span>
                    <span className="font-medium" style={{ color: "var(--cr-text)" }}>{fmt(row.value, "$")}</span>
                  </div>
                ))}
              {totalOut !== null && (
                <div className="flex justify-between px-4 py-2.5 text-sm border-t font-semibold"
                  style={{ borderColor: "var(--cr-border)", backgroundColor: "var(--cr-subtle-bg)" }}>
                  <span style={{ color: "var(--cr-text)" }}>Estimated Total</span>
                  <span style={{ color: "var(--cr-brand)" }}>{fmt(totalOut, "$")}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Financial Aid */}
      {hasAnyAid && (
        <div>
          <SectionHeading info="Need-based aid is awarded based on your family's financial situation. '% of Need Met' shows how much of your demonstrated need the school covers on average. Higher is better.">Financial Aid</SectionHeading>
          <div className="grid grid-cols-2 gap-2">
            {vm.pctNeedMet && <StatCell label="% of Need Met" value={vm.pctNeedMet} />}
            {(vm.avgFinancialAidPackage || vm.avgNeedBasedAid) && (
              <StatCell label="Avg Aid Package" value={vm.avgFinancialAidPackage ?? vm.avgNeedBasedAid ?? "—"} />
            )}
            {vm.avgNeedGrant && <StatCell label="Avg Need-Based Grant" value={vm.avgNeedGrant} />}
            {vm.pctReceivingAid && <StatCell label="% Receiving Aid" value={vm.pctReceivingAid} />}
            {school.net_price && <StatCell label="Avg Net Price†" value={fmt(school.net_price, "$")} />}
          </div>
          {school.net_price && (
            <p className="text-[10px] mt-2" style={{ color: "var(--cr-text-muted)" }}>
              † Average net price for families earning $110k+/yr after grants & scholarships.
            </p>
          )}
        </div>
      )}

      {vm.cdsYear && (
        <p className="text-[10px]" style={{ color: "var(--cr-text-faint)" }}>
          Source: Common Data Set {vm.cdsYear}–{String(vm.cdsYear + 1).slice(2)}
        </p>
      )}
    </div>
  );
}

// ── Demographics color map ────────────────────────────────────────────────────

const DEMO_COLORS: Record<string, string> = {
  "White":                    "var(--cr-text-faint)",
  "Asian":                    "#EC4899",
  "Black / African American": "#8B5CF6",
  "Hispanic / Latino":        "#F59E0B",
  "International":            "#3B82F6",
  "Multiracial":              "#F97316",
  "Native American":          "#10B981",
  "Pacific Islander":         "#06B6D4",
};

// ── Tab: Campus ───────────────────────────────────────────────────────────────

function CampusTab({ vm }: { vm: CdsViewModel }) {
  const hasDemographics = vm.demographicsWithCounts.length > 0;
  const hasCampusLife = vm.outOfStatePct || vm.onCampusHousingPct || vm.retentionRate || vm.graduationRate6yr;

  if (!hasDemographics && !hasCampusLife) return <NoData />;

  const campusStats = [
    { label: "Out-of-State Students", value: vm.outOfStatePct },
    { label: "Live on Campus", value: vm.onCampusHousingPct },
    { label: "Retention Rate", value: vm.retentionRate },
    { label: "6-Year Grad Rate", value: vm.graduationRate6yr },
  ].filter(s => s.value);

  const demos = [...vm.demographicsWithCounts].sort((a, b) => b.pct - a.pct);
  const totalPct = demos.reduce((sum, d) => sum + d.pct, 0);

  return (
    <div className="space-y-4">

      {/* ── Campus Life ── */}
      {hasCampusLife && campusStats.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--cr-border)" }}>
          <SectionHeading info="Key stats about life at this school. Retention rate is the % of freshmen who return for sophomore year — a high rate signals student satisfaction. The 6-year grad rate shows how many students earn their degree within 6 years.">Campus Life</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            {campusStats.map(({ label, value }) => (
              <div key={label} className="rounded-lg p-3" style={{ backgroundColor: "var(--cr-subtle-bg)" }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: "var(--cr-text-faint)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: "var(--cr-text)" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Diversity ── */}
      {hasDemographics && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--cr-border)" }}>
          <SectionHeading info="Racial and ethnic breakdown of enrolled undergraduates, as reported in the Common Data Set. Percentages may not sum to 100% if some students did not report.">Student Body Composition</SectionHeading>
          <div className="flex gap-8 items-center">

            {/* Donut SVG */}
            <div className="flex-shrink-0" style={{ width: 220, height: 220 }}>
              <svg width="220" height="220" viewBox="0 0 220 220">
                {(() => {
                  const R = 82, STROKE = 28;
                  const CIRC = 2 * Math.PI * R;
                  let offset = 0;
                  return demos.map(({ label, pct }) => {
                    const color = DEMO_COLORS[label] ?? "var(--cr-text-faint)";
                    const share = totalPct > 0 ? pct / totalPct : pct / 100;
                    const dash = Math.max(0, share * CIRC - 2);
                    const gap = CIRC - dash;
                    const rotate = (offset / (totalPct > 0 ? totalPct : 100)) * 360 - 90;
                    offset += pct;
                    if (dash <= 0) return null;
                    return (
                      <circle
                        key={label}
                        cx="110" cy="110" r={R}
                        fill="none"
                        stroke={color}
                        strokeWidth={STROKE}
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={0}
                        transform={`rotate(${rotate} 110 110)`}
                      />
                    );
                  });
                })()}
                <text x="110" y="104" textAnchor="middle" fontSize="12" fill="var(--cr-text-faint)" fontWeight="500">undergrads</text>
                {vm.totalUndergraduates && (
                  <text x="110" y="124" textAnchor="middle" fontSize="18" fill="var(--cr-text)" fontWeight="800">
                    {vm.totalUndergraduates.toLocaleString()}
                  </text>
                )}
              </svg>
            </div>

            {/* Legend rows */}
            <div className="flex-1 space-y-3">
              {demos.map(({ label, pct, count }) => {
                const color = DEMO_COLORS[label] ?? "var(--cr-text-faint)";
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm flex-1" style={{ color: "var(--cr-text-body)" }}>{label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--cr-text)" }}>{pct.toFixed(1)}%</span>
                    {count !== null && (
                      <span className="text-sm tabular-nums font-medium" style={{ color: "var(--cr-text-faint)", width: "54px", textAlign: "right" }}>
                        {count.toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {vm.cdsYear && (
        <p className="text-[10px]" style={{ color: "var(--cr-text-faint)" }}>
          Source: Common Data Set {vm.cdsYear}–{String(vm.cdsYear + 1).slice(2)}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SchoolDetailPanel({
  row,
  open,
  onClose,
  onNotesChange,
  mode = "list",
  exploreSchool,
  onAddToList,
  onBack,
  isOnList = false,
  isFavorite = false,
  canFavorite = true,
  onToggleFavorite,
}: SchoolDetailPanelProps) {
  const [essays, setEssays] = useState<StructuredEssayPromptRow[]>([]);
  const [essaySummary, setEssaySummary] = useState<EssayRequirementSummaryRow | null>(null);
  const [loadingEssays, setLoadingEssays] = useState(true);
  const [cdsData, setCdsData] = useState<CdsDataRow | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [logoError, setLogoError] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  const school = mode === "explore" ? exploreSchool ?? null : (row?.schools ?? null);
  const essayVm = buildEssayRequirementsViewModel(essaySummary, essays);
  const cdsVm = buildCdsViewModel(cdsData);

  useEffect(() => {
    if (!school || !open) return;
    setEssays([]);
    setEssaySummary(null);
    setCdsData(null);
    setLoadingEssays(true);
    setLogoError(false);

    Promise.all([
      supabase
        .from("essay_prompts")
        .select("id, prompt_text, word_limit, section_key, section_title, section_order, prompt_order, prompt_title")
        .eq("school_id", school.id)
        .order("section_order", { ascending: true, nullsFirst: false })
        .order("prompt_order", { ascending: true, nullsFirst: false }),
      supabase
        .from("essay_requirement_summaries")
        .select("school_id, display_title, application_type, essay_count_summary, word_limit_summary")
        .eq("school_id", school.id)
        .maybeSingle(),
      supabase
        .from("cds_data")
        .select("*")
        .eq("school_id", school.id)
        .maybeSingle(),
    ]).then(([promptsResult, summaryResult, cdsResult]) => {
      setEssays(promptsResult.data ?? []);
      setEssaySummary(summaryResult.data ?? null);
      setCdsData(sanitizeCdsDataRow((cdsResult.data as CdsDataRow) ?? null));
      setLoadingEssays(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.id, open]);

  useEffect(() => {
    setNotesValue(row?.notes ?? "");
  }, [row?.id, row?.notes]);

  async function saveNotes() {
    if (!row || !onNotesChange) return;
    onNotesChange(row.id, notesValue);
    await fetch("/api/schools/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, notes: notesValue }),
    });
  }

  if (!school || (mode === "list" && !row)) return null;

  const faviconUrl = school.website_url
    ? `https://www.google.com/s2/favicons?domain=${school.website_url}&sz=64`
    : null;

  const hasMap = school.latitude != null && school.longitude != null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[1px]"
          style={{ zIndex: 200 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Side panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={school.name}
        className="fixed top-0 right-0 flex flex-col bg-[var(--cr-card-bg)] shadow-2xl"
        style={{
          zIndex: 201,
          width: "min(100vw, 1100px)",
          height: "100dvh",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          borderLeft: "1px solid var(--cr-border)",
        }}
      >

        {/* ── Header ── */}
        <div
          className="px-4 md:px-6 py-3 md:py-4 border-b flex items-start justify-between gap-3 flex-shrink-0"
          style={{ borderColor: "var(--cr-border)", backgroundColor: "var(--cr-card-bg)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {mode === "explore" && onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex-shrink-0"
                style={{ color: "var(--cr-text-body)" }}
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            {faviconUrl && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt=""
                width={40}
                height={40}
                onError={() => setLogoError(true)}
                className="w-10 h-10 rounded-lg object-contain flex-shrink-0 border p-1 bg-[var(--cr-card-bg)]"
                style={{ borderColor: "var(--cr-border)" }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
                style={{ borderColor: "var(--cr-border)", backgroundColor: "var(--cr-subtle-bg)" }}>
                <AcademicCapIcon className="w-5 h-5" style={{ color: "var(--cr-text-muted)" }} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-base font-semibold leading-tight" style={{ color: "var(--cr-text)" }}>{school.name}</p>
                {mode === "list" && onToggleFavorite && (
                  <button
                    onClick={onToggleFavorite}
                    title={isFavorite ? "Unstar" : canFavorite ? "Star this school" : "Max 3 stars"}
                    className="flex-shrink-0 transition-colors"
                    style={{ color: isFavorite ? "#F59E0B" : "var(--cr-text-disabled, #C7C3BE)" }}
                  >
                    {isFavorite
                      ? <StarIconSolid className="w-5 h-5" style={{ color: "#F59E0B" }} />
                      : <StarIcon className="w-5 h-5" />
                    }
                  </button>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--cr-text-muted)" }}>
                {[school.city, school.state].filter(Boolean).join(", ")}
                {school.school_type ? ` · ${school.school_type}` : ""}
                {school.setting ? ` · ${school.setting}` : ""}
              </p>
              {school.website_url && (
                <a
                  href={school.website_url.startsWith("http") ? school.website_url : `https://${school.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-0.5 inline-flex items-center gap-1 hover:underline"
                  style={{ color: "var(--cr-brand)" }}
                >
                  {school.website_url.replace(/^https?:\/\//, "")}
                  <ArrowTopRightOnSquareIcon className="w-3 h-3 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {mode === "explore" && onAddToList && (
              <button
                onClick={() => !isOnList && onAddToList(school)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"
                style={isOnList
                  ? { borderColor: "var(--cr-pill-green-border)", backgroundColor: "var(--cr-pill-green-bg)", color: "var(--cr-pill-green-text)" }
                  : { borderColor: "var(--cr-brand)", backgroundColor: "var(--cr-brand)", color: "white" }}
              >
                {isOnList ? <><CheckIcon className="w-3.5 h-3.5" />Added</> : <><PlusIcon className="w-3.5 h-3.5" />Add to List</>}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              <XMarkIcon className="w-4 h-4" style={{ color: "var(--cr-text-muted)" }} />
            </button>
          </div>
        </div>

        {/* ── Mobile quick stats strip ── */}
        <div
          className="flex md:hidden overflow-x-auto gap-px flex-shrink-0 border-b"
          style={{ borderColor: "var(--cr-border)", backgroundColor: "var(--cr-subtle-bg)" }}
        >
          {[
            { label: "Acceptance", value: school.acceptance_rate !== null ? `${(school.acceptance_rate * 100).toFixed(0)}%` : "—" },
            { label: "SAT Range", value: school.sat_25th && school.sat_75th ? `${school.sat_25th}–${school.sat_75th}` : "—" },
            { label: "Tuition", value: school.tuition_out_of_state ? `$${school.tuition_out_of_state.toLocaleString()}` : "—" },
            { label: "Grad Rate", value: school.grad_rate !== null ? `${(school.grad_rate * 100).toFixed(0)}%` : "—" },
            { label: "Enrollment", value: school.enrollment ? school.enrollment.toLocaleString() : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex-shrink-0 flex flex-col items-center justify-center px-4 py-2.5 bg-[var(--cr-card-bg)]" style={{ minWidth: "80px" }}>
              <p className="text-[10px] font-medium whitespace-nowrap" style={{ color: "var(--cr-text-faint)" }}>{label}</p>
              <p className="text-sm font-semibold mt-0.5 whitespace-nowrap" style={{ color: "var(--cr-text)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0 divide-x" style={{ borderColor: "var(--cr-border)" }}>
          {/* Left sidebar (desktop only) */}
          <div className="hidden md:block w-[280px] flex-shrink-0 overflow-y-auto px-5 py-5 space-y-5">
            {hasMap && (
              <SchoolMap lat={school.latitude as number} lon={school.longitude as number} />
            )}

            {/* Admissions quick stats */}
            <div>
              <SectionHeading>Admissions</SectionHeading>
              <div className="grid grid-cols-2 gap-2">
                <StatCell label="Acceptance" value={
                  school.acceptance_rate !== null
                    ? `${(school.acceptance_rate * 100).toFixed(0)}%`
                    : "—"
                } />
                <StatCell label="SAT Range" value={
                  school.sat_25th && school.sat_75th
                    ? `${school.sat_25th}–${school.sat_75th}` : "—"
                } />
                <StatCell label="Test Policy" value={
                  school.test_policy === "Considered but not Required" ? "Optional"
                  : school.test_policy === "Neither Required nor Recommended" ? "Test-Free"
                  : school.test_policy ?? "—"
                } />
                <StatCell label="Enrollment" value={school.enrollment ? school.enrollment.toLocaleString() : "—"} />
              </div>
            </div>

            {/* Cost quick stats */}
            <div>
              <SectionHeading>Cost</SectionHeading>
              <div className="grid grid-cols-2 gap-2">
                <StatCell label="Tuition" value={fmt(school.tuition_out_of_state, "$")} />
                <StatCell label="Net Price" value={fmt(school.net_price, "$")} />
              </div>
            </div>

            {/* Outcomes */}
            <div>
              <SectionHeading>Outcomes</SectionHeading>
              <div className="grid grid-cols-2 gap-2">
                <StatCell label="Grad Rate" value={
                  school.grad_rate !== null ? `${(school.grad_rate * 100).toFixed(0)}%` : "—"
                } />
                <StatCell label="Median Earnings" value={fmt(school.median_earnings, "$")} />
              </div>
            </div>

            {/* Notes — list mode only */}
            {mode === "list" && (
              <div>
                <SectionHeading>Notes</SectionHeading>
                <textarea
                  ref={notesRef}
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={saveNotes}
                  placeholder="Add notes about this school..."
                  rows={3}
                  className="w-full text-sm rounded-lg border px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-900 transition-shadow"
                  style={{ borderColor: "var(--cr-border)", color: "var(--cr-text)", backgroundColor: "var(--cr-page-bg)" }}
                />
              </div>
            )}
          </div>

          {/* Right: tabs */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Tabs defaultValue="essays" className="flex flex-col h-full">
              <TabsList
                className="w-full justify-start rounded-none border-b px-4 h-10 gap-0 bg-transparent flex-shrink-0"
                style={{ borderColor: "var(--cr-border)" }}
              >
                {[
                  { value: "essays", label: "Essays" },
                  { value: "admissions", label: "Admissions" },
                  { value: "costs", label: "Costs & Aid" },
                  { value: "campus", label: "Campus" },
                ].map(({ value, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-none h-full px-4 text-xs font-medium border-b-2 border-transparent data-[state=active]:border-blue-900 data-[state=active]:text-blue-900 data-[state=inactive]:text-stone-400 bg-transparent shadow-none"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="essays" className="px-6 py-5 mt-0">
                  <EssayPanel vm={essayVm} loading={loadingEssays} />
                </TabsContent>
                <TabsContent value="admissions" className="px-6 py-5 mt-0">
                  <AdmissionsTab vm={cdsVm} school={school} />
                </TabsContent>
                <TabsContent value="costs" className="px-6 py-5 mt-0">
                  <CostsAidTab vm={cdsVm} school={school} />
                </TabsContent>
                <TabsContent value="campus" className="px-6 py-5 mt-0">
                  <CampusTab vm={cdsVm} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
