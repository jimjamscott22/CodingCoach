/**
 * Database type definitions for Supabase tables
 */

import { Language, ScoreBreakdown, Suggestion } from "./review";

export interface DbFile {
  id: string;
  user_id: string;
  name: string;
  language: Language;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DbReview {
  id: string;
  file_id: string;
  user_id: string;
  overall_score: number;
  score_breakdown: ScoreBreakdown;
  summary: string;
  language: Language;
  verbosity: "quick" | "deep";
  reviewed_at: string;
  created_at: string;
}

export interface DbSuggestion {
  id: string;
  review_id: string;
  principle: string;
  severity: "critical" | "major" | "minor";
  message: string;
  code_snippet: string | null;
  suggested_fix: string | null;
  line_range: { start: number; end: number } | null;
  created_at: string;
}

export interface ReviewWithFile extends DbReview {
  file: DbFile;
  suggestions: DbSuggestion[];
}

export interface ReviewDelta {
  id: string;
  file_id: string;
  user_id: string;
  overall_score: number;
  prev_score: number | null;
  score_delta: number;
  reviewed_at: string;
  prev_reviewed_at: string | null;
}
