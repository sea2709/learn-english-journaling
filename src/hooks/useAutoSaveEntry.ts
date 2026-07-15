"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveEntry } from "@/lib/api";
import { formatTodayDisplay, formatTodayISO } from "@/lib/entry-utils";
import type { EntryBlock, StoredJournalEntry } from "@/lib/types";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export interface SaveResult {
  ok: boolean;
  error?: string;
}

interface UseAutoSaveEntryOptions {
  entryId: string;
  title: string;
  blocks: EntryBlock[];
  canSave: boolean;
  debounceMs?: number;
  onSaved?: (entry: StoredJournalEntry) => void;
}

function serializeSnapshot(title: string, blocks: EntryBlock[]): string {
  return JSON.stringify({ title, blocks });
}

function buildEntry(
  entryId: string,
  title: string,
  blocks: EntryBlock[]
): StoredJournalEntry {
  return {
    id: entryId,
    title: title.trim() || formatTodayDisplay(),
    date: formatTodayISO(),
    blocks,
    status: "saved",
  };
}

export function useAutoSaveEntry({
  entryId,
  title,
  blocks,
  canSave,
  debounceMs = 10_000,
  onSaved,
}: UseAutoSaveEntryOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(
    null
  );
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const entryIdRef = useRef(entryId);
  const titleRef = useRef(title);
  const blocksRef = useRef(blocks);
  const canSaveRef = useRef(canSave);
  const onSavedRef = useRef(onSaved);
  const debounceMsRef = useRef(debounceMs);
  const persistEntryRef = useRef<() => Promise<SaveResult>>(async () => ({
    ok: false,
  }));

  useEffect(() => {
    entryIdRef.current = entryId;
    titleRef.current = title;
    blocksRef.current = blocks;
    canSaveRef.current = canSave;
    onSavedRef.current = onSaved;
    debounceMsRef.current = debounceMs;
    lastSavedSnapshotRef.current = lastSavedSnapshot;
  });

  const currentSnapshot = serializeSnapshot(title, blocks);
  const isDirty = canSave && lastSavedSnapshot !== currentSnapshot;

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const persistEntry = useCallback(async (): Promise<SaveResult> => {
    if (!canSaveRef.current) {
      return { ok: false, error: "Nothing to save." };
    }

    const snapshot = serializeSnapshot(
      titleRef.current,
      blocksRef.current
    );

    if (lastSavedSnapshotRef.current === snapshot) {
      return { ok: true };
    }

    if (savingRef.current) {
      return { ok: false, error: "Save already in progress." };
    }

    savingRef.current = true;
    setSaveStatus("saving");

    try {
      const saved = await saveEntry(
        buildEntry(entryIdRef.current, titleRef.current, blocksRef.current)
      );
      lastSavedSnapshotRef.current = snapshot;
      setLastSavedSnapshot(snapshot);
      setSaveStatus("saved");
      onSavedRef.current?.(saved);

      const latestSnapshot = serializeSnapshot(
        titleRef.current,
        blocksRef.current
      );
      if (latestSnapshot !== snapshot && canSaveRef.current) {
        setSaveStatus("pending");
        clearDebounce();
        debounceTimerRef.current = setTimeout(() => {
          void persistEntryRef.current();
        }, debounceMsRef.current);
      }

      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save entry.";
      setSaveStatus("error");
      return { ok: false, error: message };
    } finally {
      savingRef.current = false;
    }
  }, [clearDebounce]);

  useEffect(() => {
    persistEntryRef.current = persistEntry;
  }, [persistEntry]);

  const saveNow = useCallback(async (): Promise<SaveResult> => {
    clearDebounce();
    return persistEntry();
  }, [clearDebounce, persistEntry]);

  const flush = useCallback(async (): Promise<SaveResult> => {
    clearDebounce();
    if (!canSaveRef.current) {
      return { ok: true };
    }

    const snapshot = serializeSnapshot(titleRef.current, blocksRef.current);
    if (lastSavedSnapshotRef.current === snapshot) {
      return { ok: true };
    }

    return persistEntry();
  }, [clearDebounce, persistEntry]);

  const markSaved = useCallback(
    (savedTitle: string, savedBlocks: EntryBlock[]) => {
      clearDebounce();
      const snapshot = serializeSnapshot(savedTitle, savedBlocks);
      lastSavedSnapshotRef.current = snapshot;
      setLastSavedSnapshot(snapshot);
      setSaveStatus("idle");
    },
    [clearDebounce]
  );

  useEffect(() => {
    if (!canSave) {
      clearDebounce();
      return;
    }

    if (lastSavedSnapshot === currentSnapshot) {
      return;
    }

    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      void persistEntryRef.current();
    }, debounceMs);

    const pendingTimer = setTimeout(() => {
      setSaveStatus((prev) => (prev === "saving" ? prev : "pending"));
    }, 0);

    return () => {
      clearDebounce();
      clearTimeout(pendingTimer);
    };
  }, [
    canSave,
    currentSnapshot,
    debounceMs,
    clearDebounce,
    lastSavedSnapshot,
  ]);

  useEffect(() => {
    if (saveStatus !== "saved") return;

    const timer = setTimeout(() => {
      setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
    }, 3000);

    return () => clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!canSaveRef.current) return;

      const snapshot = serializeSnapshot(titleRef.current, blocksRef.current);
      if (lastSavedSnapshotRef.current === snapshot) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return {
    saveStatus,
    isDirty,
    saveNow,
    flush,
    markSaved,
  };
}

export function getSaveStatusLabel(
  saveStatus: SaveStatus,
  isDirty: boolean
): string | null {
  switch (saveStatus) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Couldn't save — try Save";
    case "pending":
      return "Unsaved changes";
    case "idle":
      return isDirty ? "Unsaved changes" : null;
  }
}
