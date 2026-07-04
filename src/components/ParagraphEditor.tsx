"use client";

import { useRef, useState } from "react";
import type { EntryBlock, JournalParagraph } from "@/lib/types";
import {
  createImageBlock,
  createParagraph,
  isTextBlock,
} from "@/lib/entry-utils";
import {
  deleteEntryImage,
  uploadEntryImage,
} from "@/lib/entry-images";
import { ImageBlock } from "./ImageBlock";
import { ParagraphBlock } from "./ParagraphBlock";

interface ParagraphEditorProps {
  blocks: EntryBlock[];
  activeBlockId: string | null;
  analyzingParagraphId: string | null;
  userId: string;
  entryId: string;
  onBlocksChange: (blocks: EntryBlock[]) => void;
  onActiveBlockChange: (id: string) => void;
  onAnalyzeParagraph: (id: string) => void;
  onError: (message: string) => void;
}

export function ParagraphEditor({
  blocks,
  activeBlockId,
  analyzingParagraphId,
  userId,
  entryId,
  onBlocksChange,
  onActiveBlockChange,
  onAnalyzeParagraph,
  onError,
}: ParagraphEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isWriting = activeBlockId !== null;

  const textBlockIndexById = new Map<string, number>();
  let textIndex = 0;
  for (const block of blocks) {
    if (isTextBlock(block)) {
      textBlockIndexById.set(block.id, textIndex);
      textIndex += 1;
    }
  }

  const updateParagraph = (id: string, text: string) => {
    onBlocksChange(
      blocks.map((block) =>
        block.type === "text" && block.id === id ? { ...block, text } : block
      )
    );
  };

  const handleSplit = (id: string, cursorPos: number) => {
    const index = blocks.findIndex((block) => block.id === id);
    if (index === -1) return;

    const block = blocks[index];
    if (block.type !== "text") return;

    const before = block.text.slice(0, cursorPos);
    const after = block.text.slice(cursorPos);

    const newParagraph = createParagraph(after);
    const updated: JournalParagraph = { ...block, text: before };

    const next = [
      ...blocks.slice(0, index),
      updated,
      newParagraph,
      ...blocks.slice(index + 1),
    ];

    onBlocksChange(next);
    onActiveBlockChange(newParagraph.id);

    requestAnimationFrame(() => {
      const wrapper = document.querySelector(
        `[data-block-id="${newParagraph.id}"]`
      );
      const el = wrapper?.querySelector("textarea");
      el?.focus();
    });
  };

  const handleRemoveImage = async (id: string) => {
    const block = blocks.find((item) => item.id === id);
    if (!block || block.type !== "image") return;

    try {
      await deleteEntryImage(block.path);
    } catch {
      // Still remove from the editor if storage cleanup fails.
    }

    const next = blocks.filter((item) => item.id !== id);
    onBlocksChange(next.length > 0 ? next : [createParagraph()]);

    if (activeBlockId === id) {
      const fallback =
        next.find((item) => item.type === "text")?.id ?? next[0]?.id ?? null;
      if (fallback) onActiveBlockChange(fallback);
    }
  };

  const handleAddImage = async (file: File) => {
    setUploading(true);
    try {
      const { id, path } = await uploadEntryImage(userId, entryId, file);
      const imageBlock = { ...createImageBlock(path), id };

      const activeIndex = activeBlockId
        ? blocks.findIndex((block) => block.id === activeBlockId)
        : -1;
      const insertAt = activeIndex >= 0 ? activeIndex + 1 : blocks.length;

      const next = [
        ...blocks.slice(0, insertAt),
        imageBlock,
        ...blocks.slice(insertAt),
      ];

      onBlocksChange(next);
      onActiveBlockChange(imageBlock.id);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <div key={block.id} data-block-id={block.id}>
          {block.type === "text" ? (
            <ParagraphBlock
              paragraph={block}
              index={textBlockIndexById.get(block.id) ?? 0}
              isActive={activeBlockId === block.id}
              isWriting={isWriting}
              isAnalyzing={analyzingParagraphId === block.id}
              onTextChange={updateParagraph}
              onSelect={onActiveBlockChange}
              onAnalyze={onAnalyzeParagraph}
              onSplit={handleSplit}
            />
          ) : (
            <ImageBlock
              block={block}
              onSelect={onActiveBlockChange}
              onRemove={handleRemoveImage}
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 pl-14">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex min-h-11 items-center gap-1.5 py-2 font-sans text-sm text-pen hover:text-ink-900 disabled:opacity-50 sm:min-h-0 sm:py-0"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
          {uploading ? "Uploading…" : "Add image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleAddImage(file);
          }}
        />
        <p className="font-sans text-sm text-ink-400">
          <span className="sm:hidden">
            Enter — new paragraph · Tap Check for feedback
          </span>
          <span className="hidden sm:inline">
            Enter — new paragraph · Ctrl+Enter — check paragraph
          </span>
        </p>
      </div>
    </div>
  );
}
