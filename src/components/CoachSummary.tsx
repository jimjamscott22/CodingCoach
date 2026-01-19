import type { ReviewResponse } from "@/types/review";

interface CoachSummaryProps {
  review: ReviewResponse | null;
  loading: boolean;
}

export function CoachSummary({ review, loading }: CoachSummaryProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Coach Summary
        </h2>
        <div className="mt-3 space-y-2 animate-pulse">
          <div className="h-3 bg-zinc-700 rounded w-full"></div>
          <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Coach Summary
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Your mentor-style summary will show up here with concrete next steps
          and confidence boosters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Coach Summary
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-200">
        {review.summary}
      </p>
    </div>
  );
}
