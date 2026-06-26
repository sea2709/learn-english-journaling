"use client";

/** Display grammar score on a 0–10 scale (storage remains 0–100). */
export function scoreToDisplay(score: number): number {
  return Math.round((score / 100) * 10 * 10) / 10;
}

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md";
}

export function ScoreRing({ score, size = "md" }: ScoreRingProps) {
  const displayScore = scoreToDisplay(score);
  const radius = size === "sm" ? 28 : 36;
  const svgSize = size === "sm" ? 72 : 96;
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 10) * circumference;

  return (
    <div
      className={`relative flex items-center justify-center ${
        size === "sm" ? "h-[72px] w-[72px]" : "h-24 w-24"
      }`}
    >
      <svg
        className="-rotate-90"
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === "sm" ? 5 : 6}
          className="text-paper-line"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === "sm" ? 5 : 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-pen-light"
        />
      </svg>
      <div className="absolute text-center">
        <span
          className={`font-display font-semibold text-ink-900 ${
            size === "sm" ? "text-lg" : "text-2xl"
          }`}
        >
          {displayScore}
        </span>
        {size === "md" && (
          <p className="text-[10px] uppercase tracking-wide text-ink-500">
            / 10
          </p>
        )}
      </div>
    </div>
  );
}
