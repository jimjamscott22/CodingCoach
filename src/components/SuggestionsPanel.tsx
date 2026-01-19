import type { ReviewResponse } from "@/types/review";
import { useMemo } from "react";

interface SuggestionsPanelProps {
  review: ReviewResponse | null;
  loading: boolean;
  selectedSuggestionId: string | null;
  onSelectSuggestion: (id: string) => void;
}

const severityConfig = {
  critical: {
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    label: "Critical",
  },
  major: {
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    label: "Major",
  },
  minor: {
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    label: "Minor",
  },
};

const principleLabels: Record<string, string> = {
  descriptiveNaming: "Naming",
  functionSize: "Function Size",
  explicitDependencies: "Dependencies",
  errorHandling: "Error Handling",
  controlFlow: "Control Flow",
  sideEffects: "Side Effects",
  magicNumbers: "Magic Numbers",
};

export function SuggestionsPanel({
  review,
  loading,
  selectedSuggestionId,
  onSelectSuggestion,
}: SuggestionsPanelProps) {
  const selectedSuggestion = useMemo(() => {
    if (!review || !selectedSuggestionId) return null;
    return review.suggestions.find(
      (s, idx) => selectedSuggestionId === `suggestion-${idx}`,
    );
  }, [review, selectedSuggestionId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Suggestions
          </h2>
          <span className="text-xs text-zinc-500">Loading…</span>
        </div>
        <div className="mt-3 space-y-2 animate-pulse">
          <div className="h-12 bg-zinc-700 rounded"></div>
          <div className="h-12 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!review || review.suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Suggestions
          </h2>
          <span className="text-xs text-zinc-500">Click to focus</span>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          {review ? "No suggestions—great code!" : "Submit code to get suggestions."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Suggestions
          </h2>
          <span className="text-xs text-zinc-500">
            {review.suggestions.length} item{review.suggestions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {review.suggestions.map((suggestion, idx) => {
            const id = `suggestion-${idx}`;
            const isSelected = id === selectedSuggestionId;
            const severity = severityConfig[suggestion.severity];

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectSuggestion(id)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 text-blue-100"
                    : "border-zinc-800 bg-zinc-900/70 text-zinc-200 hover:border-blue-500/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug flex-1">
                    {suggestion.message}
                  </p>
                  <span
                    className={`border text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${severity.badge}`}
                  >
                    {severity.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {principleLabels[suggestion.principle] || suggestion.principle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSuggestion && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
          <h3 className="text-sm font-semibold text-blue-300">
            {selectedSuggestion.message}
          </h3>

          {selectedSuggestion.codeSnippet && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 mb-2">
                Problem
              </p>
              <pre className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-xs overflow-x-auto text-zinc-300">
                <code>{selectedSuggestion.codeSnippet}</code>
              </pre>
            </div>
          )}

          {selectedSuggestion.suggestedFix && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500 mb-2">
                Suggested Fix
              </p>
              <pre className="rounded-lg bg-green-950/20 border border-green-500/20 p-3 text-xs overflow-x-auto text-green-300">
                <code>{selectedSuggestion.suggestedFix}</code>
              </pre>
            </div>
          )}

          {selectedSuggestion.lineRange && (
            <p className="mt-3 text-xs text-zinc-400">
              Lines {selectedSuggestion.lineRange.start}–
              {selectedSuggestion.lineRange.end}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
