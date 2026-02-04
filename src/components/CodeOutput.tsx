"use client";

import type { RunResult } from "@/lib/codeRunner";

interface CodeOutputProps {
  result: RunResult | null;
  loading: boolean;
  pyodideLoading: boolean;
  language: string;
}

export function CodeOutput({ result, loading, pyodideLoading, language }: CodeOutputProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {pyodideLoading && language === "python"
            ? "Loading Python runtime (first run only)..."
            : "Running code..."}
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Output</span>
        <span className="text-xs text-zinc-500">
          {result.executionTime.toFixed(0)}ms
        </span>
      </div>
      <div className="p-4 font-mono text-sm">
        {result.error ? (
          <div className="space-y-2">
            {result.output && (
              <pre className="whitespace-pre-wrap text-zinc-300">{result.output}</pre>
            )}
            <pre className="whitespace-pre-wrap text-red-400">{result.error}</pre>
          </div>
        ) : result.output ? (
          <pre className="whitespace-pre-wrap text-emerald-400">{result.output}</pre>
        ) : (
          <span className="text-zinc-500 italic">No output</span>
        )}
      </div>
    </div>
  );
}
