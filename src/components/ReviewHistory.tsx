/**
 * ReviewHistory component - displays past code reviews
 */

"use client";

import { useReviewHistory } from "@/hooks/useReviewHistory";
import { ReviewWithFile } from "@/types/database";

interface ReviewHistoryProps {
  userId: string | null;
  onSelectReview?: (review: ReviewWithFile) => void;
}

export function ReviewHistory({ userId, onSelectReview }: ReviewHistoryProps) {
  const { reviews, loading, error } = useReviewHistory(userId);

  if (!userId) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          History
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to save and track your review history.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          History
        </h2>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-zinc-800/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          History
        </h2>
        <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          History
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          No reviews yet. Submit your first code review to get started!
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
          History
        </h2>
        <span className="text-xs text-zinc-500">{reviews.length} reviews</span>
      </div>

      <div className="space-y-2">
        {reviews.map((review) => (
          <button
            key={review.id}
            onClick={() => onSelectReview?.(review)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">
                {review.file.name}
              </span>
              <span
                className={`text-lg font-semibold ${getScoreColor(review.overall_score)}`}
              >
                {review.overall_score}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="capitalize">{review.file.language}</span>
              <span>•</span>
              <span>
                {new Date(review.reviewed_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span>•</span>
              <span>{review.suggestions.length} suggestions</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
