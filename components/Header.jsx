"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // If pathname changed (navigation finished), hide loader
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // Helper: only set loading if target is different from current pathname
  const handleLinkClick = (href) => {
    // normalize trailing slash for safer compare
    const normalize = (p) => (p === "/" ? "/" : p?.replace(/\/+$/, "") || "");
    if (normalize(href) !== normalize(pathname)) {
      setLoading(true);
    }
    // if same path, don't show loader (avoids stuck spinner)
  };

  return (
    <header className="ftu-header bg-white shadow-md relative">
      <div className="ftu-header__inner flex justify-between items-center px-6 py-3">
        {/* Brand text wrapped in Link to go Home */}
        <Link
          href="/"
          onClick={() => handleLinkClick("/")}
          className="ftu-header__brand text-xl font-bold text-[#a80534] hover:opacity-80 transition"
        >
          FTU Application Form
        </Link>

        <nav className="ftu-header__nav flex gap-3" aria-label="Primary">
          {/* My Applications button */}
          <Link
            href="/applicationList"
            onClick={() => handleLinkClick("/applicationList")}
            className="ftu-header__link px-4 py-2 rounded-lg bg-[#a80534] text-white font-medium hover:bg-[#8a042a] transition"
          >
            My Applications
          </Link>

          {/* Create New button */}
          <Link
            href="/application/stream"
            onClick={() => handleLinkClick("/application/stream")}
            className="ftu-header__link px-4 py-2 rounded-lg border border-[#a80534] text-[#a80534] font-medium hover:bg-[#a80534] hover:text-white transition"
          >
            + Create New
          </Link>
        </nav>
      </div>

      {/* Loader Overlay (only UI — no functional changes) */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
          <div className="animate-spin h-6 w-6 border-4 border-[#a80534] border-t-transparent rounded-full" />
        </div>
      )}
    </header>
  );
}