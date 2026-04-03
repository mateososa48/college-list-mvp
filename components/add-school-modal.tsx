"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  ChevronDownIcon,
  MapPinIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import Map, { Popup, Source, Layer, MapRef } from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface School {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  school_type: "Public" | "Private" | null;
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
  latitude: number | null;
  longitude: number | null;
}

interface LocationPin {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
}

interface SuggestionCategory {
  id: "state_match" | "stats_match" | "explore_new";
  label: string;
  emoji: string;
  schools: School[];
}

interface AddSchoolModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSchoolAdded: (row: any) => void;
  externalOpen?: boolean;
  onExternalOpenConsumed?: () => void;
  existingSchoolIds?: string[];
  existingAcceptanceRates?: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onExplore?: (school: School) => void;
  hideForExplore?: boolean;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [-86.79, 32.80], AK: [-152.40, 64.20], AZ: [-111.09, 34.05], AR: [-92.37, 34.97],
  CA: [-119.42, 36.78], CO: [-105.55, 39.11], CT: [-72.75, 41.60], DE: [-75.50, 39.00],
  FL: [-81.52, 27.99], GA: [-83.44, 32.17], HI: [-157.50, 20.79], ID: [-114.74, 44.07],
  IL: [-89.20, 40.35], IN: [-86.13, 40.27], IA: [-93.21, 41.88], KS: [-98.37, 38.53],
  KY: [-84.27, 37.67], LA: [-91.83, 31.17], ME: [-69.38, 45.37], MD: [-76.64, 39.05],
  MA: [-71.53, 42.23], MI: [-84.51, 44.32], MN: [-93.90, 46.39], MS: [-89.68, 32.75],
  MO: [-92.29, 38.46], MT: [-110.45, 46.88], NE: [-98.27, 41.49], NV: [-116.42, 38.81],
  NH: [-71.57, 43.19], NJ: [-74.41, 40.06], NM: [-106.25, 34.84], NY: [-74.95, 43.30],
  NC: [-79.01, 35.63], ND: [-101.30, 47.53], OH: [-82.79, 40.39], OK: [-96.92, 35.57],
  OR: [-120.55, 43.93], PA: [-77.19, 41.20], RI: [-71.47, 41.68], SC: [-80.95, 33.86],
  SD: [-99.90, 44.44], TN: [-86.69, 35.52], TX: [-99.33, 31.47], UT: [-111.09, 39.32],
  VT: [-72.71, 44.05], VA: [-78.66, 37.77], WA: [-120.74, 47.75], WV: [-80.45, 38.49],
  WI: [-89.62, 44.27], WY: [-107.55, 43.08], DC: [-77.03, 38.91],
};

const clusterLayer: LayerProps = {
  id: "clusters",
  type: "circle",
  source: "schools",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": ["step", ["get", "point_count"], "#93C5FD", 10, "#60A5FA", 50, "#3B82F6"],
    "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 28],
    "circle-opacity": 0.85,
  },
};

const clusterCountLayer: LayerProps = {
  id: "cluster-count",
  type: "symbol",
  source: "schools",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
  paint: { "text-color": "#fff" },
};

const unclusteredPointLayer: LayerProps = {
  id: "unclustered-point",
  type: "circle",
  source: "schools",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#4B7FE8",
    "circle-radius": 6,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#fff",
  },
};

function SchoolRow({
  school,
  isAdded,
  isAdding,
  onAdd,
  onExplore,
}: {
  school: School;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
  onExplore: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 border-b hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors last:border-0"
      style={{ borderColor: "var(--cr-border)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {school.website_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://www.google.com/s2/favicons?domain=${school.website_url}&sz=32`}
            alt=""
            width={16}
            height={16}
            className="w-4 h-4 rounded-sm flex-shrink-0 object-contain"
          />
        ) : (
          <div className="w-4 h-4 rounded-sm flex-shrink-0 bg-stone-100 dark:bg-stone-800" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--cr-text)" }}>
            {school.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--cr-text-muted)" }}>
            {[school.city, school.state].filter(Boolean).join(", ")}
            {school.school_type ? ` · ${school.school_type}` : ""}
            {school.acceptance_rate !== null
              ? ` · ${(school.acceptance_rate * 100).toFixed(0)}% acceptance`
              : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <button
          onClick={onExplore}
          className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md transition-colors"
          style={{ color: "var(--cr-text-muted)", backgroundColor: "var(--cr-subtle-bg)", border: "1px solid var(--cr-border)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--cr-border)"; e.currentTarget.style.color = "var(--cr-text-body)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--cr-subtle-bg)"; e.currentTarget.style.color = "var(--cr-text-muted)"; }}
        >
          <MagnifyingGlassIcon className="w-3 h-3" />
          Explore
        </button>
        <button
          onClick={onAdd}
          disabled={isAdded || isAdding}
          className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md transition-colors"
          style={{
            backgroundColor: isAdded ? "var(--cr-pill-green-bg)" : "#DBEAFE",
            color: isAdded ? "var(--cr-pill-green-text)" : "#1D4ED8",
            border: `1px solid ${isAdded ? "var(--cr-pill-green-border)" : "#93C5FD"}`,
            opacity: isAdding ? 0.7 : 1,
          }}
        >
          {isAdding ? (
            <div className="w-3 h-3 border border-blue-300/50 border-t-blue-700 rounded-full animate-spin" />
          ) : isAdded ? (
            <CheckIcon className="w-3 h-3" />
          ) : (
            <PlusIcon className="w-3 h-3" />
          )}
          {isAdded ? "Added" : "Add"}
        </button>
      </div>
    </div>
  );
}

export default function AddSchoolModal({
  onSchoolAdded,
  externalOpen,
  onExternalOpenConsumed,
  existingSchoolIds = [],
  existingAcceptanceRates: _existingAcceptanceRates = [],
  onExplore,
  hideForExplore = false,
}: AddSchoolModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<SuggestionCategory[]>([]);
  const [categorySkips, setCategorySkips] = useState<Record<string, number>>({});
  const [reloadingCategory, setReloadingCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set(existingSchoolIds));
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterState, setFilterState] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSize, setFilterSize] = useState("");
  const [filterAcceptance, setFilterAcceptance] = useState("");
  const [locations, setLocations] = useState<LocationPin[]>([]);
  const [popupSchool, setPopupSchool] = useState<LocationPin | null>(null);
  const [popupExploreLoading, setPopupExploreLoading] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const mapStyle = mounted && resolvedTheme === "dark"
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);

  // Fetch all school locations once for the map
  useEffect(() => {
    if (!open || locations.length > 0) return;
    fetch("/api/schools/locations")
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? []))
      .catch(() => {});
  }, [open, locations.length]);

  // Fetch suggested schools when modal opens
  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams();
    if (existingSchoolIds.length > 0) params.set("list", existingSchoolIds.join(","));
    fetch(`/api/schools/suggested?${params}`)
      .then((r) => r.json())
      .then((d) => setSuggestedCategories(d.categories ?? []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (externalOpen) {
      setOpen(true);
      onExternalOpenConsumed?.();
    }
  }, [externalOpen, onExternalOpenConsumed]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setError(null);
      setAdded(new Set(existingSchoolIds));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const search = useCallback(async (q: string, state: string, type: string, size: string, acceptance: string) => {
    const hasSearch = q.length >= 2 || !!state || !!type || !!size || !!acceptance;
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    searchAbortRef.current?.abort();
    searchAbortRef.current = null;

    if (!hasSearch) {
      setLoading(false);
      setError(null);
      setResults([]);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (state) params.set("state", state);
      if (type) params.set("type", type);
      if (size) params.set("size", size);
      if (acceptance) params.set("acceptance", acceptance);

      const res = await fetch(`/api/schools/search?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      if (searchRequestIdRef.current !== requestId) return;
      setResults(data.results ?? []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (searchRequestIdRef.current !== requestId) return;
      setError("Search failed");
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null;
      }
      if (searchRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  // Search on every keystroke — no debounce needed since we hit Supabase now
  useEffect(() => {
    search(query, filterState, filterType, filterSize, filterAcceptance);
  }, [query, filterState, filterType, filterSize, filterAcceptance, search]);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
    };
  }, []);

  // Fly map to state centroid when state filter changes
  useEffect(() => {
    if (!filterState || !mapRef.current) return;
    const centroid = STATE_CENTROIDS[filterState];
    if (centroid) {
      mapRef.current.flyTo({ center: centroid, zoom: 6, duration: 1200 });
    }
  }, [filterState]);

  const geojson = {
    type: "FeatureCollection" as const,
    features: locations.map((loc) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [loc.longitude, loc.latitude] },
      properties: { id: loc.id, name: loc.name, city: loc.city, state: loc.state },
    })),
  };

  async function addSchool(school: School) {
    if (added.has(school.id)) return;
    setAdding(school.id);
    setError(null);
    try {
      const res = await fetch("/api/schools/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(school),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setAdded((prev) => new Set(prev).add(school.id));
        } else {
          setError(data.error ?? "Failed to add school");
        }
        return;
      }
      onSchoolAdded({ ...data.userSchool, schools: data.school });
      setAdded((prev) => new Set(prev).add(school.id));
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(null);
    }
  }

  const CATEGORY_LIMITS: Record<string, number> = { state_match: 4, stats_match: 4, explore_new: 3 };

  async function reloadCategory(categoryId: string) {
    setReloadingCategory(categoryId);
    const newSkip = (categorySkips[categoryId] ?? 0) + (CATEGORY_LIMITS[categoryId] ?? 4);
    setCategorySkips((prev) => ({ ...prev, [categoryId]: newSkip }));
    try {
      const params = new URLSearchParams({ category: categoryId, skip: String(newSkip) });
      if (existingSchoolIds.length > 0) params.set("list", existingSchoolIds.join(","));
      const res = await fetch(`/api/schools/suggested?${params}`);
      const d = await res.json();
      const updated = (d.categories ?? []) as SuggestionCategory[];
      if (updated.length > 0) {
        setSuggestedCategories((prev) =>
          prev.map((cat) => (cat.id === categoryId ? updated[0] : cat))
        );
      }
    } catch {
      // silently fail — existing suggestions remain
    } finally {
      setReloadingCategory(null);
    }
  }

  async function exploreSchoolFromMap() {
    if (!popupSchool) return;

    const schoolFromList = [...results, ...suggestedCategories.flatMap((c) => c.schools)].find((school) => school.id === popupSchool.id);
    if (schoolFromList) {
      onExplore?.(schoolFromList);
      setPopupSchool(null);
      return;
    }

    setPopupExploreLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ id: popupSchool.id });
      const res = await fetch(`/api/schools/details?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to load school details");
        return;
      }

      if (!data.school) {
        setError("Failed to load school details");
        return;
      }

      onExplore?.(data.school as School);
      setPopupSchool(null);
    } catch {
      setError("Failed to load school details");
    } finally {
      setPopupExploreLoading(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleMapClick(e: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features = e.features as any[] | undefined;
    if (!features?.length) { setPopupSchool(null); return; }
    const f = features[0];
    if (f.layer?.id === "clusters") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = mapRef.current?.getSource("schools") as any;
      const coords = f.geometry.coordinates;
      source?.getClusterExpansionZoom(f.properties?.cluster_id).then((zoom: number) => {
        mapRef.current?.flyTo({ center: coords, zoom, duration: 800 });
      }).catch(() => {});
    } else if (f.layer?.id === "unclustered-point") {
      const props = f.properties;
      const coords = f.geometry.coordinates;
      setPopupSchool({ id: props.id, name: props.name, city: props.city, state: props.state, longitude: coords[0], latitude: coords[1] });
    }
  }

  const hasFilters = filterState || filterType || filterSize || filterAcceptance;
  const showResults = query.length >= 2 || !!hasFilters;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-8 px-4 text-xs font-semibold flex items-center gap-1.5 rounded-full"
        style={{ backgroundColor: "var(--cr-brand)" }}
      >
        <PlusIcon className="w-3.5 h-3.5" />
        Add School
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={`p-0 gap-0 overflow-hidden flex flex-col max-sm:!w-screen max-sm:!h-screen max-sm:!max-w-none max-sm:!rounded-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!top-0 max-sm:!left-0 transition-opacity duration-150${hideForExplore ? " opacity-0 pointer-events-none" : ""}`}
          overlayClassName={hideForExplore ? "opacity-0 pointer-events-none" : undefined}
          style={{
            maxWidth: "900px",
            width: "90vw",
            height: "80vh",
            borderColor: "var(--cr-border)",
          }}
        >
          <DialogTitle className="sr-only">Add a school</DialogTitle>

          {/* Top bar: search + filters + close */}
          <div className="flex items-center gap-2 px-4 py-3 pr-14 border-b flex-shrink-0" style={{ borderColor: "var(--cr-border)" }}>
            <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--cr-text-muted)" }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search colleges..."
              className="flex-1 text-sm bg-transparent focus:outline-none"
              style={{ color: "var(--cr-text)" }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800">
                <XMarkIcon className="w-4 h-4" style={{ color: "var(--cr-text-muted)" }} />
              </button>
            )}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-colors hover:bg-stone-50"
              style={{
                borderColor: hasFilters ? "var(--cr-brand)" : "var(--cr-border)",
                color: hasFilters ? "var(--cr-brand)" : "var(--cr-text-body)",
                backgroundColor: hasFilters ? "var(--cr-brand-bg)" : "var(--cr-card-bg)",
              }}
            >
              <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
              Filters
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-900 inline-block" />}
            </button>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap flex-shrink-0" style={{ borderColor: "var(--cr-border)", backgroundColor: "var(--cr-page-bg)" }}>
              {/* State */}
              <div className="relative">
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="h-7 pl-2 pr-6 text-xs border rounded-md appearance-none focus:outline-none cursor-pointer"
                  style={{ borderColor: filterState ? "var(--cr-brand)" : "var(--cr-border)", color: "var(--cr-text-body)", backgroundColor: filterState ? "var(--cr-brand-bg)" : "var(--cr-card-bg)" }}
                >
                  <option value="">All States</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "var(--cr-text-muted)" }} />
              </div>
              {/* Type */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-7 pl-2 pr-6 text-xs border rounded-md appearance-none focus:outline-none cursor-pointer"
                  style={{ borderColor: filterType ? "var(--cr-brand)" : "var(--cr-border)", color: "var(--cr-text-body)", backgroundColor: filterType ? "var(--cr-brand-bg)" : "var(--cr-card-bg)" }}
                >
                  <option value="">Any Type</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "var(--cr-text-muted)" }} />
              </div>
              {/* Size */}
              <div className="relative">
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="h-7 pl-2 pr-6 text-xs border rounded-md appearance-none focus:outline-none cursor-pointer"
                  style={{ borderColor: filterSize ? "var(--cr-brand)" : "var(--cr-border)", color: "var(--cr-text-body)", backgroundColor: filterSize ? "var(--cr-brand-bg)" : "var(--cr-card-bg)" }}
                >
                  <option value="">Any Size</option>
                  <option value="small">Small (&lt;5k)</option>
                  <option value="medium">Medium (5–15k)</option>
                  <option value="large">Large (&gt;15k)</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "var(--cr-text-muted)" }} />
              </div>
              {/* Acceptance */}
              <div className="relative">
                <select
                  value={filterAcceptance}
                  onChange={(e) => setFilterAcceptance(e.target.value)}
                  className="h-7 pl-2 pr-6 text-xs border rounded-md appearance-none focus:outline-none cursor-pointer"
                  style={{ borderColor: filterAcceptance ? "var(--cr-brand)" : "var(--cr-border)", color: "var(--cr-text-body)", backgroundColor: filterAcceptance ? "var(--cr-brand-bg)" : "var(--cr-card-bg)" }}
                >
                  <option value="">Any Acceptance</option>
                  <option value="under10">&lt;10%</option>
                  <option value="10to30">10–30%</option>
                  <option value="30to50">30–50%</option>
                  <option value="over50">&gt;50%</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "var(--cr-text-muted)" }} />
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setFilterState(""); setFilterType(""); setFilterSize(""); setFilterAcceptance(""); }}
                  className="h-7 px-2 text-xs rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  style={{ color: "var(--cr-text-muted)" }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Body: left panel + map */}
          <div className="flex flex-1 min-h-0">
            {/* Left panel */}
            <div className="flex-1 flex flex-col md:border-r overflow-hidden" style={{ borderColor: "var(--cr-border)" }}>
              {error && (
                <div className="px-4 py-2 text-xs border-b" style={{ borderColor: "var(--cr-border)", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                  {error}
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {loading && (
                  <div className="flex justify-center py-8">
                    <div className="w-4 h-4 border-2 border-stone-200 border-t-blue-900 rounded-full animate-spin" />
                  </div>
                )}

                {!loading && showResults && results.length === 0 && (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--cr-text-muted)" }}>
                    No schools found
                  </div>
                )}

                {!loading && showResults && results.map((school) => (
                  <SchoolRow
                    key={school.id}
                    school={school}
                    isAdded={added.has(school.id)}
                    isAdding={adding === school.id}
                    onAdd={() => addSchool(school)}
                    onExplore={() => { onExplore?.(school); }}
                  />
                ))}

                {/* Suggested colleges (shown when not searching) */}
                {!showResults && suggestedCategories.length > 0 && (
                  <div className="pb-2">
                    {suggestedCategories.map((category) => (
                      <div key={category.id}>
                        <div className="px-4 pt-4 pb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.emoji}</span>
                            <span
                              className="text-[17px] font-semibold"
                              style={{ color: "var(--cr-text)" }}
                            >
                              {category.label}
                            </span>
                          </div>
                          <button
                            onClick={() => reloadCategory(category.id)}
                            disabled={reloadingCategory === category.id}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors"
                            style={{ color: "var(--cr-text-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--cr-text-body)"; e.currentTarget.style.backgroundColor = "var(--cr-subtle-bg)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--cr-text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                            title="Refresh suggestions"
                          >
                            <ArrowPathIcon
                              className={`w-3 h-3 ${reloadingCategory === category.id ? "animate-spin" : ""}`}
                            />
                          </button>
                        </div>
                        {category.schools.map((school) => (
                          <SchoolRow
                            key={school.id}
                            school={school}
                            isAdded={added.has(school.id)}
                            isAdding={adding === school.id}
                            onAdd={() => addSchool(school)}
                            onExplore={() => { onExplore?.(school); }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {!showResults && suggestedCategories.length === 0 && (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--cr-text-muted)" }}>
                    Type to search, or use filters
                  </div>
                )}
              </div>
            </div>

            {/* Map (hidden on mobile) */}
            <div className="hidden md:block relative" style={{ flex: "0 0 40%" }}>
              <div className="absolute top-4 right-4 z-10 pointer-events-auto">
                <div
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm backdrop-blur-sm"
                  style={{
                    borderColor: "var(--cr-border)",
                    backgroundColor: "var(--cr-card-bg)",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <MapPinIcon className="w-3.5 h-3.5" style={{ color: "var(--cr-text-muted)" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--cr-text-muted)" }}>
                      State
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      value={filterState}
                      onChange={(e) => setFilterState(e.target.value)}
                      className="h-7 pl-2 pr-6 text-xs font-medium border rounded-md appearance-none focus:outline-none cursor-pointer"
                      style={{
                        minWidth: "112px",
                        borderColor: filterState ? "var(--cr-brand)" : "var(--cr-border)",
                        color: "var(--cr-text-body)",
                        backgroundColor: filterState ? "var(--cr-brand-bg)" : "var(--cr-card-bg)",
                      }}
                    >
                      <option value="">Jump to state</option>
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon
                      className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3"
                      style={{ color: "var(--cr-text-muted)" }}
                    />
                  </div>

                  {filterState && (
                    <button
                      onClick={() => setFilterState("")}
                      className="h-7 px-2 rounded-md text-xs font-medium transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                      style={{ color: "var(--cr-text-muted)" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <Map
                  ref={mapRef}
                  initialViewState={{ longitude: -98.5, latitude: 39.5, zoom: 3.5 }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle={mapStyle}
                  interactiveLayerIds={["clusters", "unclustered-point"]}
                  onClick={handleMapClick}
                  cursor="pointer"
                >
                  {locations.length > 0 && (
                    <Source
                      id="schools"
                      type="geojson"
                      data={geojson}
                      cluster={true}
                      clusterMaxZoom={10}
                      clusterRadius={40}
                    >
                      <Layer {...clusterLayer} />
                      <Layer {...clusterCountLayer} />
                      <Layer {...unclusteredPointLayer} />
                    </Source>
                  )}

                  {popupSchool && (
                    <Popup
                      longitude={popupSchool.longitude}
                      latitude={popupSchool.latitude}
                      anchor="bottom"
                      onClose={() => setPopupSchool(null)}
                      closeButton={false}
                      offset={12}
                    >
                      <div className="p-2 min-w-[160px]">
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--cr-text)" }}>{popupSchool.name}</p>
                        <p className="text-xs mb-2" style={{ color: "var(--cr-text-muted)" }}>{[popupSchool.city, popupSchool.state].filter(Boolean).join(", ")}</p>
                        <button
                          onClick={exploreSchoolFromMap}
                          disabled={popupExploreLoading}
                          className="text-xs font-medium px-2 py-1 rounded w-full text-center transition-colors"
                          style={{
                            backgroundColor: "var(--cr-brand-bg)",
                            color: "var(--cr-brand)",
                            opacity: popupExploreLoading ? 0.7 : 1,
                          }}
                        >
                          {popupExploreLoading ? "Opening..." : "Explore"}
                        </button>
                      </div>
                    </Popup>
                  )}
                </Map>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
