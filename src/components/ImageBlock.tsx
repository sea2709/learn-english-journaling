"use client";

import { useEffect, useState } from "react";
import type { JournalImageBlock } from "@/lib/types";
import { getSignedImageUrl } from "@/lib/entry-images";

interface ImageBlockProps {
  block: JournalImageBlock;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ImageBlock({
  block,
  onSelect,
  onRemove,
}: ImageBlockProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getSignedImageUrl(block.path)
      .then((signedUrl) => {
        if (!cancelled) {
          setUrl(signedUrl);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load image.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [block.path]);

  return (
    <div
      className="group relative"
      onClick={() => onSelect(block.id)}
    >
      <div className="relative ml-12 overflow-hidden rounded border border-paper-line/60 bg-paper-line/20">
        {loading && (
          <div className="flex h-40 items-center justify-center font-sans text-xs text-ink-400">
            Loading image…
          </div>
        )}

        {error && !loading && (
          <div className="flex h-40 items-center justify-center px-4 text-center font-sans text-xs text-coral-800">
            {error}
          </div>
        )}

        {url && !loading && !error && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="max-h-96 w-full object-contain"
          />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(block.id);
          }}
          className="absolute right-2 top-2 min-h-11 min-w-11 rounded bg-ink-900/70 px-2 py-1 font-sans text-[11px] text-white opacity-100 transition-opacity focus:opacity-100 sm:min-h-0 sm:min-w-0 sm:opacity-0 sm:group-hover:opacity-100"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
