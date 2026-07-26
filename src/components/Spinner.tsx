const SIZE_CLASS = {
  sm: "h-3.5 w-3.5 border-2",
  md: "h-8 w-8 border-2",
} as const;

const TONE_CLASS = {
  default: "border-paper-line border-t-pen",
  inverse: "border-white/30 border-t-white",
} as const;

type SpinnerProps = {
  size?: keyof typeof SIZE_CLASS;
  tone?: keyof typeof TONE_CLASS;
  className?: string;
  /** When set, announces as a live status; omit when adjacent visible text already describes the busy state. */
  label?: string;
};

export function Spinner({
  size = "md",
  tone = "default",
  className = "",
  label,
}: SpinnerProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 animate-spin rounded-full ${SIZE_CLASS[size]} ${TONE_CLASS[tone]} ${className}`}
    />
  );
}
