"use client";

import type { Extension } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { useMemo, useState } from "react";
import { useReview } from "@/hooks/useReview";
import { useAuth } from "@/hooks/useAuth";
import { ScoreCard } from "@/components/ScoreCard";
import { CoachSummary } from "@/components/CoachSummary";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { AuthModal } from "@/components/AuthModal";
import { ReviewHistory } from "@/components/ReviewHistory";
import { CodeOutput } from "@/components/CodeOutput";
import { runCode, canRunLanguage, isPyodideLoaded, type RunResult } from "@/lib/codeRunner";
import type { ReviewWithFile } from "@/types/database";

type LanguageKey = "javascript" | "python" | "java" | "c";
type Verbosity = "quick" | "deep";
type Provider = "ollama" | "lmstudio";

const languageOptions: Array<{ label: string; value: LanguageKey }> = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C", value: "c" },
];

const languageExtensions: Record<LanguageKey, Extension> = {
  javascript: javascript({ jsx: true }),
  python: python(),
  java: java(),
  c: cpp(),
};

const defaultCodeExamples: Record<LanguageKey, string> = {
  javascript: `function processUsers(users) {
  let totalAge = 0;
  for (let i = 0; i < users.length; i++) {
    totalAge += users[i].age;
  }
  return totalAge / users.length;
}

function run(data) {
  try {
    return processUsers(data);
  } catch (error) {}
}
`,
  python: `def process_users(users):
    total_age = 0
    for i in range(len(users)):
        total_age += users[i]["age"]
    return total_age / len(users)

def run(data):
    try:
        return process_users(data)
    except:
        pass
`,
  java: `public class UserProcessor {
    public static double processUsers(User[] users) {
        int totalAge = 0;
        for (int i = 0; i < users.length; i++) {
            totalAge += users[i].age;
        }
        return totalAge / users.length;
    }

    public static Double run(User[] data) {
        try {
            return processUsers(data);
        } catch (Exception e) {}
        return null;
    }
}
`,
  c: `#include <stdio.h>

double process_users(int ages[], int count) {
    int total_age = 0;
    for (int i = 0; i < count; i++) {
        total_age += ages[i];
    }
    return total_age / count;
}

int main() {
    int ages[] = {25, 30, 35};
    double avg = process_users(ages, 3);
    printf("Average: %f\\n", avg);
    return 0;
}
`,
};

const fileExtensions: Record<LanguageKey, string> = {
  javascript: "js",
  python: "py",
  java: "java",
  c: "c",
};

export default function Home() {
  const [code, setCode] = useState(defaultCodeExamples.javascript);
  const [language, setLanguage] = useState<LanguageKey>("javascript");
  const [verbosity, setVerbosity] = useState<Verbosity>("quick");
  const [fileName, setFileName] = useState("example.js");

  const handleLanguageChange = (newLanguage: LanguageKey) => {
    const currentIsDefault = Object.values(defaultCodeExamples).includes(code);
    setLanguage(newLanguage);
    if (currentIsDefault) {
      setCode(defaultCodeExamples[newLanguage]);
      setFileName(`example.${fileExtensions[newLanguage]}`);
    }
  };
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(
    null,
  );
  const [provider, setProvider] = useState<Provider>("ollama");
  const [model, setModel] = useState("");
  const [healthStatus, setHealthStatus] = useState<string>("Not checked");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [runningCode, setRunningCode] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);

  const { review, loading, error, submitReview } = useReview();
  const { user, loading: authLoading, signOut } = useAuth();

  const extensions = useMemo(
    () => [languageExtensions[language]],
    [language],
  );

  const checkHealth = async () => {
    setCheckingHealth(true);
    setHealthStatus("Checking...");
    try {
      const response = await fetch("/api/health/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Health check failed");
      }
      const models = Array.isArray(data.availableModels) ? data.availableModels : [];
      setAvailableModels(models);
      setHealthStatus(`${data.message} — ${data.baseUrl}`);
      // Auto-select model: keep current if valid, otherwise use first available or API default
      if (models.length > 0) {
        if (!model || !models.includes(model)) {
          setModel(models.includes(data.model) ? data.model : models[0]);
        }
      } else if (data.model) {
        setModel(data.model as string);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health check failed";
      setHealthStatus(`Error: ${message}`);
      setAvailableModels([]);
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleRunCode = async () => {
    if (!canRunLanguage(language)) return;

    setRunningCode(true);
    setRunResult(null);

    // Check if Pyodide needs to load (only for Python, first run)
    if (language === "python" && !isPyodideLoaded()) {
      setPyodideLoading(true);
    }

    try {
      const result = await runCode(code, language);
      setRunResult(result);
    } finally {
      setRunningCode(false);
      setPyodideLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setSelectedSuggestionId(null);
    await submitReview({
      code,
      language,
      verbosity,
      fileName,
      userId: user?.id,
      provider,
      model,
    });
  };

  const handleSelectReview = (review: ReviewWithFile) => {
    setCode(review.file.content);
    setLanguage(review.file.language);
    setFileName(review.file.name);
    // Scroll to top to show the code
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-400">
              Coding Coach
            </p>
            <h1 className="text-2xl font-semibold text-zinc-100">
              Review code like a production mentor
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Score, explanations, and concrete fixes for real-world readiness.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">{user.email}</span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="rounded-md border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Sign Out
                </button>
              </div>
            )}
            {!user && !authLoading && (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-400"
              >
                Sign In
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs">
              <select
                value={provider}
                onChange={(event) => {
                  setProvider(event.target.value as Provider);
                  setAvailableModels([]);
                  setModel("");
                  setHealthStatus("Not checked");
                }}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ollama">Ollama</option>
                <option value="lmstudio">LM Studio</option>
              </select>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="w-44 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableModels.length === 0 ? (
                  <option value="">Click Check to load models</option>
                ) : (
                  availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={checkHealth}
                className="rounded-md bg-blue-500 px-3 py-1 font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700"
                disabled={checkingHealth}
              >
                {checkingHealth ? "Checking" : "Check"}
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 p-1 text-xs">
              <button
                type="button"
                onClick={() => setVerbosity("quick")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  verbosity === "quick"
                    ? "bg-blue-500 text-white"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                Quick review
              </button>
              <button
                type="button"
                onClick={() => setVerbosity("deep")}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  verbosity === "deep"
                    ? "bg-blue-500 text-white"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                Deep dive
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={loading}
              className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {loading ? "Reviewing..." : "Submit for review"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                File Name
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="example.js"
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Language
              </label>
              <select
                value={language}
                onChange={(event) =>
                  handleLanguageChange(event.target.value as LanguageKey)
                }
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {canRunLanguage(language) && (
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={runningCode}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
                >
                  {runningCode ? "Running..." : "Run"}
                </button>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs uppercase tracking-[0.2em] text-zinc-400 transition hover:border-blue-500 hover:text-blue-300">
              Upload file
              <input
                type="file"
                className="hidden"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.h,.cpp"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs text-zinc-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-500">Provider</span>
              <span className="text-zinc-200">{provider}</span>
              <span className="text-zinc-500">Model</span>
              <span className="text-zinc-200">{model || "(none)"}</span>
            </div>
            <div className="text-right text-xs text-zinc-400">
              <p>{healthStatus}</p>
              {availableModels.length > 0 && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available
                </p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-lg shadow-black/30">
            <CodeMirror
              value={code}
              height="420px"
              theme={oneDark}
              extensions={extensions}
              onChange={(value) => setCode(value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              {canRunLanguage(language)
                ? "Run code in-browser before submitting for review."
                : `In-browser execution not available for ${language === "java" ? "Java" : "C"}.`}
            </span>
            <span>Verbosity: {verbosity === "quick" ? "Quick" : "Deep"}</span>
          </div>

          <CodeOutput
            result={runResult}
            loading={runningCode}
            pyodideLoading={pyodideLoading}
            language={language}
          />
        </section>

        <aside className="space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-300 font-medium">Error</p>
              <p className="mt-1 text-sm text-red-200">{error}</p>
            </div>
          )}
          <ScoreCard review={review} loading={loading} />
          <CoachSummary review={review} loading={loading} />
          <SuggestionsPanel
            review={review}
            loading={loading}
            selectedSuggestionId={selectedSuggestionId}
            onSelectSuggestion={setSelectedSuggestionId}
          />

          <ReviewHistory userId={user?.id || null} onSelectReview={handleSelectReview} />
        </aside>
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
