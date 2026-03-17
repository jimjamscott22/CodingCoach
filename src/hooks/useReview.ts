/**
 * Hook for calling the /api/review endpoint
 */

"use client";

import { useState } from "react";
import { ReviewRequest, ReviewResponse } from "@/types/review";

interface SubmitReviewRequest extends ReviewRequest {
  provider?: string;
  model?: string;
}

interface UseReviewReturn {
  review: ReviewResponse | null;
  loading: boolean;
  error: string | null;
  submitReview: (request: SubmitReviewRequest) => Promise<void>;
}

export function useReview(): UseReviewReturn {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = async (request: SubmitReviewRequest) => {
    setLoading(true);
    setError(null);

    try {
      // Call API to get review
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: request.code,
          language: request.language,
          verbosity: request.verbosity,
          provider: request.provider,
          model: request.model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get review");
      }

      const data: ReviewResponse = await response.json();
      setReview(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setReview(null);
    } finally {
      setLoading(false);
    }
  };

  return { review, loading, error, submitReview };
}
