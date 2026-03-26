import Link from "next/link";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

export default function TopBar() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b"
      style={{ backgroundColor: "#FAFAF9", borderColor: "#E7E5E4" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: "#1E3A8A" }}
        >
          <span className="text-white text-[10px] font-bold">CL</span>
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: "#1A1A1A" }}>
          College List
        </span>
      </div>

      <nav className="flex items-center gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-stone-100"
          style={{ color: "#78716C" }}
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Settings
        </Link>
      </nav>
    </header>
  );
}
