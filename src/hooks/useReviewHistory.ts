/**
 * Hook for fetching review history from database
 */

"use client";

import { useEffect, useState } from "react";
import { getReviewsByUser } from "@/lib/database/reviews";
import { ReviewWithFile } from "@/types/database";

interface UseReviewHistoryReturn {
  reviews: ReviewWithFile[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useReviewHistory(userId: string | null): UseReviewHistoryReturn {
  const [reviews, setReviews] = useState<ReviewWithFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!userId) {
      setReviews([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getReviewsByUser(userId);
      setReviews(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load reviews";
      setError(errorMessage);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  return {
    reviews,
    loading,
    error,
    refresh: fetchReviews,
  };
}
