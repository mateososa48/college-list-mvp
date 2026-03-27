"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cog6ToothIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function TopBar() {
  const pathname = usePathname();
  const isSettings = pathname === "/settings";

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 h-14"
      style={{ backgroundColor: "#FAFAF9" }}
    >
      <div className="flex items-center" style={{ fontFamily: "var(--font-brand)", fontWeight: 700 }}>
        <span className="text-3xl tracking-tight" style={{ color: "#1A1A1A" }}>College</span>
        <span className="text-3xl tracking-tight" style={{ color: "#1E3A8A" }}>Roster</span>
      </div>

      <nav className="flex items-center gap-1">
        {isSettings ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-stone-100"
            style={{ color: "#78716C" }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
        ) : (
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-stone-100"
            style={{ color: "#78716C" }}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Settings
          </Link>
        )}
      </nav>
    </header>
  );
}
