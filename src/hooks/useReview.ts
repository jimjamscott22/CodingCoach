/**
 * Hook for calling the /api/review endpoint
 * Ready to be integrated in Phase 3
 */

"use client";

import { useState } from "react";
import { ReviewRequest, ReviewResponse } from "@/types/review";

interface UseReviewReturn {
  review: ReviewResponse | null;
  loading: boolean;
  error: string | null;
  submitReview: (request: ReviewRequest) => Promise<void>;
}

export function useReview(): UseReviewReturn {
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReview = async (request: ReviewRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
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
