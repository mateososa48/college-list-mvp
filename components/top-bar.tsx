"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cog6ToothIcon, ArrowLeftIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function TopBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const isSettings = pathname === "/settings";
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-3 md:px-6 h-14 border-b"
      style={{ backgroundColor: "var(--cr-card-bg)", borderColor: "var(--cr-border)" }}
    >
      <div className="flex items-center" style={{ fontFamily: "var(--font-brand)", fontWeight: 700 }}>
        <span className="text-2xl tracking-tight" style={{ color: "var(--cr-text)" }}>College</span>
        <span className="text-2xl tracking-tight" style={{ color: "var(--cr-brand)" }}>Roster</span>
      </div>

      <nav className="flex items-center gap-1">
        {isSettings ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
            style={{ color: "var(--cr-text-muted)" }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        ) : (
          <>
            {isAdmin && (
              <Link
                href="/admin/feedback"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                style={{ color: "var(--cr-text-muted)" }}
              >
                <ChartBarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
              style={{ color: "var(--cr-text-muted)" }}
            >
              <Cog6ToothIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          style={{ color: "var(--cr-text-muted)" }}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {mounted ? (
            isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4" />
          )}
        </button>
      </nav>
    </header>
  );
}
