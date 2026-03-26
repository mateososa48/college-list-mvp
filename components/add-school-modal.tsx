"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface ScorecardSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  school_type: "Public" | "Private";
  acceptance_rate: number | null;
  sat_25th: number | null;
  sat_75th: number | null;
  avg_gpa: number | null;
  test_policy: string | null;
  net_price: number | null;
}

interface AddSchoolModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSchoolAdded: (row: any) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AddSchoolModal({ onSchoolAdded }: AddSchoolModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScorecardSchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [open]);

  async function addSchool(school: ScorecardSchool) {
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
        setError(data.error ?? "Failed to add school");
        setAdding(null);
        return;
      }
      onSchoolAdded({ ...data.userSchool, schools: data.school });
      setOpen(false);
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(null);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-8 px-3 text-xs font-medium flex items-center gap-1.5"
        style={{ backgroundColor: "#1E3A8A" }}
      >
        <PlusIcon className="w-3.5 h-3.5" />
        Add School
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="p-0 gap-0 overflow-hidden max-w-lg"
          style={{ borderColor: "#E7E5E4" }}
        >
          <DialogTitle className="sr-only">Add a school</DialogTitle>

          {/* Search input */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: "#E7E5E4" }}
          >
            <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" style={{ color: "#78716C" }} />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search colleges..."
              className="border-0 shadow-none p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
              style={{ color: "#1A1A1A" }}
            />
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-stone-200 border-t-blue-900 rounded-full animate-spin" />
              </div>
            )}

            {!loading && results.length === 0 && query.length >= 2 && (
              <div className="py-8 text-center text-sm" style={{ color: "#78716C" }}>
                No schools found for &quot;{query}&quot;
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="py-8 text-center text-sm" style={{ color: "#78716C" }}>
                Type at least 2 characters to search
              </div>
            )}

            {!loading && results.map((school) => (
              <button
                key={school.id}
                onClick={() => addSchool(school)}
                disabled={adding === school.id}
                className="w-full flex items-center justify-between px-4 py-3 text-left border-b transition-colors hover:bg-stone-50 last:border-0"
                style={{ borderColor: "#E7E5E4" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {school.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>
                    {[school.city, school.state].filter(Boolean).join(", ")}
                    {school.school_type ? ` · ${school.school_type}` : ""}
                    {school.acceptance_rate !== null
                      ? ` · ${(school.acceptance_rate * 100).toFixed(0)}% acceptance`
                      : ""}
                  </p>
                </div>
                {adding === school.id ? (
                  <div className="w-4 h-4 border-2 border-stone-200 border-t-blue-900 rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <PlusIcon className="w-4 h-4 flex-shrink-0" style={{ color: "#78716C" }} />
                )}
              </button>
            ))}
          </div>

          {error && (
            <div
              className="px-4 py-2.5 text-xs border-t"
              style={{ borderColor: "#E7E5E4", color: "#DC2626" }}
            >
              {error}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
