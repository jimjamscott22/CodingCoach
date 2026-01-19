/**
 * Types for code review requests and responses
 */

export type Language = "javascript" | "python" | "java" | "c";

export interface ReviewRequest {
  code: string;
  language: Language;
  verbosity?: "quick" | "deep"; // Default: "quick"
}

export interface ScoreBreakdown {
  descriptiveNaming: number;
  functionSize: number;
  explicitDependencies: number;
  errorHandling: number;
  controlFlow: number;
  sideEffects: number;
  magicNumbers: number;
}

export interface Suggestion {
  principle: keyof ScoreBreakdown;
  severity: "critical" | "major" | "minor";
  message: string;
  codeSnippet?: string; // The problematic code section
  suggestedFix?: string; // How to improve it
  lineRange?: { start: number; end: number }; // For UI highlighting
}

export interface ReviewResponse {
  overallScore: number; // 0-100
  scoreBreakdown: ScoreBreakdown;
  summary: string; // Coach's constructive feedback
  suggestions: Suggestion[];
  language: Language;
  reviewedAt: string; // ISO timestamp
}
