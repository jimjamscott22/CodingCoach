import type { ReviewResponse, ScoreBreakdown } from "@/types/review";

interface ScoreCardProps {
  review: ReviewResponse | null;
  loading: boolean;
}

export function ScoreCard({ review, loading }: ScoreCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Score
          </h2>
          <span className="animate-pulse text-3xl font-semibold text-zinc-600">
            ⋯
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">Analyzing your code...</p>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Score
          </h2>
          <span className="text-3xl font-semibold text-blue-400">—</span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Submit code to receive a 0-100 score with principled breakdowns.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const scoreBreakdownLabels: Record<keyof ScoreBreakdown, string> = {
    descriptiveNaming: "Naming",
    functionSize: "Function Size",
    explicitDependencies: "Dependencies",
    errorHandling: "Error Handling",
    controlFlow: "Control Flow",
    sideEffects: "Side Effects",
    magicNumbers: "Magic Numbers",
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Score
        </h2>
        <span
          className={`text-4xl font-bold ${getScoreColor(review.overallScore)}`}
        >
          {review.overallScore}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Reviewed on{" "}
        {new Date(review.reviewedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {Object.entries(review.scoreBreakdown).map(([key, score]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs"
          >
            <span className="text-zinc-300">
              {scoreBreakdownLabels[key as keyof ScoreBreakdown]}
            </span>
            <span className={`font-semibold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
