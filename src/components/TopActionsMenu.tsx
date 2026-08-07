"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface TopActionsMenuProps {
  userEmail?: string | null;
  onNewEntry: () => void;
  onSignOut: () => void;
  onSendFeedback: () => void;
  onCheckFocus: () => void;
  onOpenReview: () => void;
  canChangePassword?: boolean;
  onChangePassword?: () => void;
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

function AppFeedbackIcon() {
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

function KeyIcon() {
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
        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
      />
    </svg>
  );
}

function AccountIcon() {
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
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19.5 8.25-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

export function TopActionsMenu({
  userEmail,
  onNewEntry,
  onSignOut,
  onSendFeedback,
  onCheckFocus,
  onOpenReview,
  canChangePassword = false,
  onChangePassword,
  onMenuOpenChange,
}: TopActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMenuOpenChange?.(menuOpen || accountMenuOpen);
  }, [menuOpen, accountMenuOpen, onMenuOpenChange]);

  const setHamburgerOpen = (open: boolean) => {
    setMenuOpen(open);
    if (open) setAccountMenuOpen(false);
  };

  const setAccountOpen = (open: boolean) => {
    setAccountMenuOpen(open);
    if (open) setMenuOpen(false);
  };

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }, []);

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
    if (shouldCompact) {
      setAccountMenuOpen(false);
    } else {
      setMenuOpen(false);
    }
  }, []);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      checkCompact();
    });

    const topbar = containerRef.current?.closest("header.topbar");
    if (!topbar) {
      return () => cancelAnimationFrame(frame);
    }

    const mq = window.matchMedia("(max-width: 639px)");
    const onMqChange = () => checkCompact();
    mq.addEventListener("change", onMqChange);

    const ro = new ResizeObserver(() => checkCompact());
    ro.observe(topbar);
    const left = topbar.querySelector(".topbar-left");
    if (left) ro.observe(left);
    if (measureRef.current) ro.observe(measureRef.current);

    return () => {
      cancelAnimationFrame(frame);
      mq.removeEventListener("change", onMqChange);
      ro.disconnect();
    };
  }, [checkCompact]);

  useEffect(() => {
    if (!menuOpen && !accountMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      closeAll();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen, accountMenuOpen, closeAll]);

  const runAction = (action: () => void) => {
    closeAll();
    action();
  };

  const accountMenuItems = (
    <>
      {userEmail && (
        <p className="top-actions-dropdown-email" title={userEmail}>
          {userEmail}
        </p>
      )}
      <button
        type="button"
        role="menuitem"
        className="top-actions-dropdown-item"
        onClick={() => runAction(onCheckFocus)}
      >
        <span className="pen" aria-hidden>
          <SettingsIcon />
        </span>
        Review focus
      </button>
      {canChangePassword && onChangePassword && (
        <button
          type="button"
          role="menuitem"
          className="top-actions-dropdown-item"
          onClick={() => runAction(onChangePassword)}
        >
          <span className="pen" aria-hidden>
            <KeyIcon />
          </span>
          Change password
        </button>
      )}
      <button
        type="button"
        role="menuitem"
        className="top-actions-dropdown-item"
        onClick={() => runAction(onSendFeedback)}
      >
        <span className="pen" aria-hidden>
          <AppFeedbackIcon />
        </span>
        App feedback
      </button>
      <div className="top-actions-dropdown-divider" role="separator" />
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
    </>
  );

  const accountTrigger = (
    <button
      type="button"
      className="lnk"
      onClick={() => setAccountOpen(!accountMenuOpen)}
      aria-expanded={accountMenuOpen}
      aria-haspopup="menu"
      aria-label="Account menu"
      title="Account"
    >
      <span className="pen" aria-hidden>
        <AccountIcon />
      </span>
      <span className="btn-label">Account</span>
      <span className="pen" aria-hidden>
        <ChevronIcon open={accountMenuOpen} />
      </span>
    </button>
  );

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
      <div className="top-actions-account">{accountTrigger}</div>
      <button
        type="button"
        onClick={onOpenReview}
        className="feedback-btn"
        aria-label="Review entry"
      >
        <span className="pen" aria-hidden>
          ✎
        </span>
        <span className="btn-label">Review</span>
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
            onClick={() => setHamburgerOpen(!menuOpen)}
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
              <div className="top-actions-dropdown-group">
                <p className="top-actions-dropdown-label">Account</p>
                {accountMenuItems}
              </div>
              <button
                type="button"
                role="menuitem"
                className="top-actions-dropdown-item"
                onClick={() => runAction(onOpenReview)}
              >
                <span className="pen" aria-hidden>
                  ✎
                </span>
                Review
              </button>
            </div>
          )}
        </div>
      ) : (
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
          <div ref={menuRef} className="top-actions-account">
            {accountTrigger}
            {accountMenuOpen && (
              <div className="top-actions-dropdown" role="menu">
                {accountMenuItems}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenReview}
            className="feedback-btn"
            aria-label="Review entry"
          >
            <span className="pen" aria-hidden>
              ✎
            </span>
            <span className="btn-label">Review</span>
          </button>
        </>
      )}
    </div>
  );
}
