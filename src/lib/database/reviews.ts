/**
 * Database operations for reviews table
 */

import { createClient } from "@/lib/supabase";
import { ReviewResponse } from "@/types/review";
import { DbReview, ReviewWithFile } from "@/types/database";

export async function saveReview(
  fileId: string,
  userId: string,
  review: ReviewResponse
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      file_id: fileId,
      user_id: userId,
      overall_score: review.overallScore,
      score_breakdown: review.scoreBreakdown,
      summary: review.summary,
      language: review.language,
      verbosity: "quick", // Default, will be updated when we add verbosity tracking
      reviewed_at: review.reviewedAt,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving review:", error);
    throw new Error(`Failed to save review: ${error.message}`);
  }

  return data.id;
}

export async function getReviewById(reviewId: string): Promise<DbReview | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (error) {
    console.error("Error fetching review:", error);
    return null;
  }

  return data;
}

export async function getReviewsByFile(fileId: string): Promise<DbReview[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("file_id", fileId)
    .order("reviewed_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data || [];
}

export async function getReviewsByUser(
  userId: string,
  limit = 20
): Promise<ReviewWithFile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      file:files(*),
      suggestions(*)
    `
    )
    .eq("user_id", userId)
    .order("reviewed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data || [];
}

export async function deleteReview(reviewId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    console.error("Error deleting review:", error);
    throw new Error(`Failed to delete review: ${error.message}`);
  }
}
