/**
 * Database operations for suggestions table
 */

import { createClient } from "@/lib/supabase";
import { Suggestion } from "@/types/review";
import { DbSuggestion } from "@/types/database";

export async function saveSuggestions(
  reviewId: string,
  suggestions: Suggestion[]
): Promise<void> {
  const supabase = createClient();

  const dbSuggestions = suggestions.map((s) => ({
    review_id: reviewId,
    principle: s.principle,
    severity: s.severity,
    message: s.message,
    code_snippet: s.codeSnippet || null,
    suggested_fix: s.suggestedFix || null,
    line_range: s.lineRange || null,
  }));

  const { error } = await supabase.from("suggestions").insert(dbSuggestions);

  if (error) {
    console.error("Error saving suggestions:", error);
    throw new Error(`Failed to save suggestions: ${error.message}`);
  }
}

export async function getSuggestionsByReview(
  reviewId: string
): Promise<DbSuggestion[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("suggestions")
    .select("*")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }

  return data || [];
}

export async function deleteSuggestionsByReview(
  reviewId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("suggestions")
    .delete()
    .eq("review_id", reviewId);

  if (error) {
    console.error("Error deleting suggestions:", error);
    throw new Error(`Failed to delete suggestions: ${error.message}`);
  }
}
