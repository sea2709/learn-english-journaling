"use client";

import { useState, type ReactNode } from "react";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${expanded ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface CollapsibleSectionProps {
  title: ReactNode;
  defaultCollapsed?: boolean;
  children: ReactNode;
  headerActions?: ReactNode;
  className?: string;
  contentClassName?: string;
  bordered?: boolean;
  headerClassName?: string;
}

export function CollapsibleSection({
  title,
  defaultCollapsed = false,
  children,
  headerActions,
  className = "",
  contentClassName = "p-6",
  bordered = true,
  headerClassName = "px-4 py-3",
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const wrapperClass = bordered
    ? "rounded-2xl border border-ink-200/60 bg-white shadow-sm"
    : "";

  return (
    <div className={`${wrapperClass} ${className}`.trim()}>
      <div
        className={`flex items-center justify-between gap-2 ${headerClassName} ${
          !collapsed && bordered ? "border-b border-ink-100" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={!collapsed}
        >
          <ChevronIcon expanded={!collapsed} />
          <div className="min-w-0 flex-1">{title}</div>
        </button>
        {headerActions}
      </div>
      {!collapsed && <div className={contentClassName}>{children}</div>}
    </div>
  );
}
