"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface TopActionsMenuProps {
  onNewEntry: () => void;
  onSignOut: () => void;
  onSendFeedback: () => void;
  onCheckFocus: () => void;
  onOpenFeedback: () => void;
  inlineNoteCount: number;
  onMenuOpenChange?: (open: boolean) => void;
}

function SignOutIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
      />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.003.827c.424.35.534.955.26 1.43l-1.296 2.247a1.125 1.125 0 0 1-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
      />
    </svg>
  );
}

export function TopActionsMenu({
  onNewEntry,
  onSignOut,
  onSendFeedback,
  onCheckFocus,
  onOpenFeedback,
  inlineNoteCount,
  onMenuOpenChange,
}: TopActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback(
    (open: boolean) => {
      setMenuOpen(open);
      onMenuOpenChange?.(open);
    },
    [onMenuOpenChange]
  );

  const checkCompact = useCallback(() => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      setCompact(true);
      return;
    }

    const topbar = containerRef.current?.closest("header.topbar");
    const measure = measureRef.current;
    const container = containerRef.current;
    if (!topbar || !measure) return;

    const left = topbar.querySelector(".topbar-left");
    const leftWidth = left?.scrollWidth ?? 0;
    const topbarStyles = getComputedStyle(topbar);
    const gap = parseFloat(topbarStyles.gap) || 8;
    const available = topbar.clientWidth - leftWidth - gap;
    const needed = measure.scrollWidth;

    let shouldCompact = needed > available;

    if (!shouldCompact && container?.querySelector(".lnk")) {
      shouldCompact = container.scrollWidth > container.clientWidth;
    }

    setCompact(shouldCompact);
  }, []);

  useLayoutEffect(() => {
    checkCompact();

    const topbar = containerRef.current?.closest("header.topbar");
    if (!topbar) return;

    const mq = window.matchMedia("(max-width: 639px)");
    const onMqChange = () => checkCompact();
    mq.addEventListener("change", onMqChange);

    const ro = new ResizeObserver(() => checkCompact());
    ro.observe(topbar);
    const left = topbar.querySelector(".topbar-left");
    if (left) ro.observe(left);
    if (measureRef.current) ro.observe(measureRef.current);

    return () => {
      mq.removeEventListener("change", onMqChange);
      ro.disconnect();
    };
  }, [checkCompact]);

  useEffect(() => {
    if (!compact) setOpen(false);
  }, [compact, setOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen, setOpen]);

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  const inlineActions = (
    <>
      <button
        type="button"
        onClick={() => void onNewEntry()}
        className="lnk"
        aria-label="New entry"
      >
        <span className="pen" aria-hidden>
          +
        </span>
        <span className="btn-label">New entry</span>
      </button>
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="lnk"
        aria-label="Sign out"
        title="Sign out"
      >
        <span className="pen" aria-hidden>
          <SignOutIcon />
        </span>
        <span className="btn-label">Sign out</span>
      </button>
      <button
        type="button"
        onClick={onSendFeedback}
        className="lnk"
        aria-label="Send feedback about the app"
        title="Send feedback about the app"
      >
        <span className="pen" aria-hidden>
          <FeedbackIcon />
        </span>
        <span className="btn-label">Send feedback</span>
      </button>
      <button
        type="button"
        onClick={onCheckFocus}
        className="lnk"
        aria-label="Check focus settings"
        title="Check focus settings"
      >
        <span className="pen" aria-hidden>
          <SettingsIcon />
        </span>
        <span className="btn-label">Check focus</span>
      </button>
      <button
        type="button"
        onClick={onOpenFeedback}
        className="feedback-btn"
        aria-label={
          inlineNoteCount > 0
            ? `Feedback, ${inlineNoteCount} notes`
            : "Feedback"
        }
      >
        <span className="pen" aria-hidden>
          ✎
        </span>
        <span className="btn-label">Feedback</span>
        {inlineNoteCount > 0 && <span className="n">{inlineNoteCount}</span>}
      </button>
    </>
  );

  return (
    <div ref={containerRef} className="top-actions">
      <div ref={measureRef} className="top-actions-measure" aria-hidden>
        {inlineActions}
      </div>

      {compact ? (
        <div ref={menuRef} className="top-actions-menu">
          <button
            type="button"
            className="top-actions-menu-btn"
            onClick={() => setOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="More actions"
          >
            <span className="pen" aria-hidden>
              <HamburgerIcon />
            </span>
          </button>

          {menuOpen && (
            <div className="top-actions-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                className="top-actions-dropdown-item"
                onClick={() => runAction(() => void onNewEntry())}
              >
                <span className="pen" aria-hidden>
                  +
                </span>
                New entry
              </button>
              <button
                type="button"
                role="menuitem"
                className="top-actions-dropdown-item"
                onClick={() => runAction(() => void onSignOut())}
              >
                <span className="pen" aria-hidden>
                  <SignOutIcon />
                </span>
                Sign out
              </button>
              <button
                type="button"
                role="menuitem"
                className="top-actions-dropdown-item"
                onClick={() => runAction(onSendFeedback)}
              >
                <span className="pen" aria-hidden>
                  <FeedbackIcon />
                </span>
                Send feedback
              </button>
              <button
                type="button"
                role="menuitem"
                className="top-actions-dropdown-item"
                onClick={() => runAction(onCheckFocus)}
              >
                <span className="pen" aria-hidden>
                  <SettingsIcon />
                </span>
                Check focus
              </button>
              <button
                type="button"
                role="menuitem"
                className="top-actions-dropdown-item"
                onClick={() => runAction(onOpenFeedback)}
              >
                <span className="pen" aria-hidden>
                  ✎
                </span>
                Feedback
                {inlineNoteCount > 0 && (
                  <span className="top-actions-dropdown-badge">
                    {inlineNoteCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        inlineActions
      )}
    </div>
  );
}
