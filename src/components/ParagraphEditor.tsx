"use client";

import type { JournalParagraph } from "@/lib/types";
import { createParagraph } from "@/lib/entry-utils";
import { ParagraphBlock } from "./ParagraphBlock";

interface ParagraphEditorProps {
  paragraphs: JournalParagraph[];
  activeParagraphId: string | null;
  analyzingParagraphId: string | null;
  onParagraphsChange: (paragraphs: JournalParagraph[]) => void;
  onActiveParagraphChange: (id: string) => void;
  onAnalyzeParagraph: (id: string) => void;
}

export function ParagraphEditor({
  paragraphs,
  activeParagraphId,
  analyzingParagraphId,
  onParagraphsChange,
  onActiveParagraphChange,
  onAnalyzeParagraph,
}: ParagraphEditorProps) {
  const isWriting = activeParagraphId !== null;

  const updateParagraph = (id: string, text: string) => {
    onParagraphsChange(
      paragraphs.map((p) => (p.id === id ? { ...p, text } : p))
    );
  };

  const handleSplit = (id: string, cursorPos: number) => {
    const index = paragraphs.findIndex((p) => p.id === id);
    if (index === -1) return;

    const paragraph = paragraphs[index];
    const before = paragraph.text.slice(0, cursorPos);
    const after = paragraph.text.slice(cursorPos);

    const newParagraph = createParagraph(after);
    const updated = { ...paragraph, text: before };

    const next = [
      ...paragraphs.slice(0, index),
      updated,
      newParagraph,
      ...paragraphs.slice(index + 1),
    ];

    onParagraphsChange(next);
    onActiveParagraphChange(newParagraph.id);

    requestAnimationFrame(() => {
      const wrapper = document.querySelector(
        `[data-paragraph-id="${newParagraph.id}"]`
      );
      const el = wrapper?.querySelector("textarea");
      el?.focus();
    });
  };

  return (
    <div className="space-y-6">
      {paragraphs.map((paragraph, index) => (
        <div key={paragraph.id} data-paragraph-id={paragraph.id}>
          <ParagraphBlock
            paragraph={paragraph}
            index={index}
            isActive={activeParagraphId === paragraph.id}
            isWriting={isWriting}
            isAnalyzing={analyzingParagraphId === paragraph.id}
            onTextChange={updateParagraph}
            onSelect={onActiveParagraphChange}
            onAnalyze={onAnalyzeParagraph}
            onSplit={handleSplit}
          />
        </div>
      ))}

      <p className="pl-12 font-sans text-[11px] text-ink-400">
        Enter — new paragraph · Ctrl+Enter — check paragraph
      </p>
    </div>
  );
}
