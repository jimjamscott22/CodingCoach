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

const defaultCode = `function processUsers(users) {
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
`;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState<LanguageKey>("javascript");
  const [verbosity, setVerbosity] = useState<Verbosity>("quick");
  const [fileName, setFileName] = useState("example.js");
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(
    null,
  );
  const [provider, setProvider] = useState<Provider>("ollama");
  const [model, setModel] = useState("llama3.1:8b-instruct");
  const [healthStatus, setHealthStatus] = useState<string>("Not checked");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      setAvailableModels(Array.isArray(data.availableModels) ? data.availableModels : []);
      setHealthStatus(`${data.message} — ${data.baseUrl}`);
      if (data.model) setModel(data.model as string);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health check failed";
      setHealthStatus(`Error: ${message}`);
      setAvailableModels([]);
    } finally {
      setCheckingHealth(false);
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
                onChange={(event) => setProvider(event.target.value as Provider)}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ollama">Ollama</option>
                <option value="lmstudio">LM Studio</option>
              </select>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Model ID"
                className="w-36 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
                  setLanguage(event.target.value as LanguageKey)
                }
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              {availableModels.length > 0 ? (
                <p className="mt-1 text-[11px] text-zinc-500">
                  Models: {availableModels.slice(0, 5).join(", ")}
                  {availableModels.length > 5 ? " …" : ""}
                </p>
              ) : null}
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
            <span>Syntax highlighted editor with monospace styling.</span>
            <span>Verbosity: {verbosity === "quick" ? "Quick" : "Deep"}</span>
          </div>
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
