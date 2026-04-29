// app/components/ScoreBadge.tsx
//
// A circular score badge with color-coded background based on the score band.
// Used twice: once for the Layer 1 prompt score, once for the Layer 2 document score.

interface ScoreBadgeProps {
  score: number;       // 0-100
  label: string;       // e.g., "Prompt Score"
  recommendation: string; // e.g., "Light review — looks solid"
}

/**
 * Map a score to Tailwind background and border classes.
 * Green for strong, red for weak.
 */
function getBandClasses(score: number): {
  bg: string;
  border: string;
  text: string;
} {
  if (score >= 80) {
    return {
      bg: "bg-emerald-900",
      border: "border-emerald-500",
      text: "text-emerald-300",
    };
  }
  if (score >= 60) {
    return {
      bg: "bg-yellow-900",
      border: "border-yellow-500",
      text: "text-yellow-300",
    };
  }
  if (score >= 40) {
    return {
      bg: "bg-orange-900",
      border: "border-orange-500",
      text: "text-orange-300",
    };
  }
  return {
    bg: "bg-red-900",
    border: "border-red-500",
    text: "text-red-300",
  };
}

export default function ScoreBadge({
  score,
  label,
  recommendation,
}: ScoreBadgeProps) {
  const classes = getBandClasses(score);

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-xl border ${classes.border} ${classes.bg} px-4 py-5 w-full`}
    >
      <span className="text-sm uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className={`text-5xl font-bold ${classes.text}`}>{score}</span>
      <span className="text-sm text-zinc-300 text-center max-w-xs">
        {recommendation}
      </span>
    </div>
  );
}
