"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "beacon_theme";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "light" || t === "dark") {
    root.setAttribute("data-theme", t);
  } else {
    root.removeAttribute("data-theme");
  }
}

function nextTheme(t: Theme): Theme {
  if (t === "system") return "light";
  if (t === "light") return "dark";
  return "system";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "light" || v === "dark") return v;
      return "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      if (theme === "system") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, theme);
      }
    } catch {
      return;
    }
  }, [theme]);

  const label = useMemo(() => {
    if (theme === "system") return "Theme: System";
    if (theme === "light") return "Theme: Light";
    return "Theme: Dark";
  }, [theme]);

  return (
    <button
      type="button"
      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
      onClick={() => setTheme((t) => nextTheme(t))}
      aria-label={label}
      title={label}
    >
      {theme === "system" ? "System" : theme === "light" ? "Light" : "Dark"}
    </button>
  );
}
