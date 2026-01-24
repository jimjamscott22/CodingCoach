/**
 * Hook for calling the /api/review endpoint and persisting to database
 */

"use client";

import { useState } from "react";
import { ReviewRequest, ReviewResponse } from "@/types/review";
import { saveFile } from "@/lib/database/files";
import { saveReview } from "@/lib/database/reviews";
import { saveSuggestions } from "@/lib/database/suggestions";

interface SubmitReviewRequest extends ReviewRequest {
  fileName?: string;
  userId?: string;
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get review");
      }

      const data: ReviewResponse = await response.json();
      setReview(data);

      // Save to database if user is authenticated
      if (request.userId && request.fileName) {
        try {
          // 1. Save file
          const fileId = await saveFile(
            request.fileName,
            request.code,
            request.language,
            request.userId
          );

          // 2. Save review
          const reviewId = await saveReview(fileId, request.userId, data);

          // 3. Save suggestions
          if (data.suggestions && data.suggestions.length > 0) {
            await saveSuggestions(reviewId, data.suggestions);
          }

          console.log("Review saved to database successfully");
        } catch (dbError) {
          console.error("Failed to save review to database:", dbError);
          // Don't throw - allow the review to display even if database save fails
        }
      }
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
