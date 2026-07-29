"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, ShoppingCart, Zap } from "lucide-react";

export default function NavBar() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-base/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-violet/15 text-accent-violet shadow-glow">
            <Zap className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-wide text-ink">
            [YOUR-SHOP-NAME]
          </span>
        </a>

        <div className="flex items-center gap-2">
          <button
            aria-label="สลับธีมสว่าง/มืด"
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition hover:border-accent-violet/50 hover:text-ink"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition hover:border-accent-violet/50 hover:text-ink">
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
