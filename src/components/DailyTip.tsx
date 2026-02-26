"use client";

import { useEffect, useState } from "react";

interface Tip {
  concept: string;
  tip: string;
  example?: string;
}

const TIPS: Tip[] = [
  {
    concept: "Single Responsibility Principle",
    tip: "Every function should do exactly one thing. If you need to use the word 'and' to describe what it does, split it into two.",
    example: "// Bad: getUserAndSendEmail()\n// Good: getUser() + sendWelcomeEmail(user)",
  },
  {
    concept: "Descriptive Naming",
    tip: "Name variables and functions for what they represent, not how they're implemented. Code is read far more than it is written.",
    example: "// Bad: let x = users.filter(u => u.a > 18)\n// Good: let adults = users.filter(u => u.age > 18)",
  },
  {
    concept: "Avoid Magic Numbers",
    tip: "Every number that isn't 0 or 1 deserves a named constant. Magic numbers hide intent and make code fragile to change.",
    example: "// Bad: if (score >= 75)\n// Good: const PASSING_SCORE = 75; if (score >= PASSING_SCORE)",
  },
  {
    concept: "Early Returns",
    tip: "Return early from functions when preconditions fail. This eliminates deep nesting and makes the happy path easy to follow.",
    example: "// Instead of nested if-else chains,\n// validate first and return, then proceed.",
  },
  {
    concept: "Error Handling Discipline",
    tip: "Never swallow errors silently. An empty catch block hides bugs that will become mysterious production failures.",
    example: "// Bad: catch (e) {}\n// Good: catch (e) { logger.error(e); throw new AppError(...) }",
  },
  {
    concept: "Explicit Dependencies",
    tip: "Pass dependencies as arguments rather than reading from global state. Functions with explicit inputs are easier to test and reason about.",
    example: "// Bad: function save() { return db.save(...) }\n// Good: function save(db) { return db.save(...) }",
  },
  {
    concept: "Function Size",
    tip: "If a function exceeds 20 lines, it's likely doing too much. Smaller functions are easier to name, test, read, and reuse.",
  },
  {
    concept: "DRY — Don't Repeat Yourself",
    tip: "Duplication is the root of many bugs. When you copy-paste code, you're creating two places that need to stay in sync forever.",
  },
  {
    concept: "Code Reviews",
    tip: "Review your own code before asking others. Read it top-to-bottom as if you're seeing it for the first time — you'll catch a surprising amount.",
  },
  {
    concept: "Immutability",
    tip: "Prefer immutable data. Mutating shared state is the #1 source of hard-to-reproduce bugs in complex programs.",
    example: "// Bad: users.push(newUser)\n// Good: const updatedUsers = [...users, newUser]",
  },
  {
    concept: "Commenting Intent, Not Mechanics",
    tip: "Good comments explain *why* code does something, not *what* it does. If you need to explain the what, your code isn't clear enough.",
    example: "// Bad: // increment counter\ni++\n// Good: // offset by 1 for 1-indexed API response\ni++",
  },
  {
    concept: "Control Flow Simplicity",
    tip: "Flatten your conditionals. Each level of nesting roughly doubles the cognitive load for the reader.",
  },
  {
    concept: "Testing Pyramid",
    tip: "Write mostly unit tests (fast, cheap), some integration tests, and few end-to-end tests. Inverting this pyramid leads to slow, brittle test suites.",
  },
  {
    concept: "The Boy Scout Rule",
    tip: "Leave every piece of code you touch slightly cleaner than you found it. Small continuous improvements compound over time.",
  },
  {
    concept: "Fail Fast",
    tip: "Validate inputs at the boundaries of your system. The further an invalid value travels before being caught, the harder it is to debug.",
  },
  {
    concept: "Pure Functions",
    tip: "A pure function always returns the same output for the same input and has no side effects. Pure functions are trivial to test.",
    example: "// Pure: add(a, b) => a + b\n// Impure: add(a) => a + globalOffset",
  },
  {
    concept: "Separation of Concerns",
    tip: "Keep data fetching, business logic, and rendering in separate layers. Mixing them makes each piece harder to change independently.",
  },
  {
    concept: "Meaningful Commit Messages",
    tip: "Write commit messages that explain *why* a change was made. Future-you reading the git log will thank present-you.",
    example: "// Bad: 'fix stuff'\n// Good: 'fix null pointer when user has no profile photo'",
  },
  {
    concept: "The Rule of Three",
    tip: "The first time you write something, just write it. The second time, note the duplication. The third time, refactor to eliminate the repetition.",
  },
  {
    concept: "Null Safety",
    tip: "Treat null as the 'billion-dollar mistake' it was called by its inventor. Prefer Optional types, default values, or null objects over null checks scattered through your code.",
  },
  {
    concept: "Dependency Inversion",
    tip: "Depend on abstractions, not concretions. Code to interfaces so you can swap implementations (e.g., swap a database, mock in tests) without changing callers.",
  },
  {
    concept: "YAGNI — You Aren't Gonna Need It",
    tip: "Don't build features 'just in case'. Premature generalization creates complexity that slows you down for requirements that may never come.",
  },
  {
    concept: "Log With Context",
    tip: "A log message like 'Error occurred' is nearly useless. Include the operation, inputs, and any IDs needed to trace the event.",
    example: "// Bad: console.error('Error')\n// Good: console.error('Failed to load user', { userId, error })",
  },
  {
    concept: "Small Pull Requests",
    tip: "Keep PRs small and focused. A PR that touches 10 files for one reason is easy to review; 2 files for 5 reasons is a nightmare.",
  },
  {
    concept: "Consistent Abstractions",
    tip: "A function should operate at one level of abstraction. Mixing high-level logic with low-level detail in the same function is disorienting.",
  },
  {
    concept: "Composition Over Inheritance",
    tip: "Favor composing small, focused objects over deep inheritance hierarchies. Composition is more flexible and much easier to reason about.",
  },
  {
    concept: "Timeout Everything",
    tip: "Any call to an external service — HTTP, database, queue — must have a timeout. Without one, a slow dependency will eventually hang your whole system.",
  },
  {
    concept: "Avoid Boolean Parameters",
    tip: "A boolean parameter is often a hidden second function. `sendEmail(user, true)` tells you nothing; split it into `sendWelcomeEmail` and `sendPasswordResetEmail`.",
  },
  {
    concept: "Types as Documentation",
    tip: "A well-typed function signature is self-documenting. The signature `(userId: string) => Promise<User>` tells you everything you need to call it correctly.",
  },
  {
    concept: "Prefer Positive Conditions",
    tip: "Positive conditions are easier to read than double negatives. `if (isActive)` is clearer than `if (!isInactive)`.",
  },
];

const STORAGE_KEY = "codingcoach_daily_tip_date";

export function DailyTip() {
  const [visible, setVisible] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen === today) return;

    // Pick a tip based on day-of-year for consistency within the day
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = Number(new Date()) - Number(start);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const selectedTip = TIPS[dayOfYear % TIPS.length];

    setTip(selectedTip);
    setVisible(true);
  }, []);

  const dismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY, today);
    setVisible(false);
  };

  if (!visible || !tip) return null;

  return (
    <div className="border-b border-blue-500/20 bg-blue-500/5 px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-400">
              Daily Concept
            </span>
            <span className="text-sm font-semibold text-zinc-200">{tip.concept}</span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-400">{tip.tip}</p>
          {tip.example && (
            <pre className="mt-1.5 overflow-x-auto rounded-md bg-zinc-900/80 px-3 py-2 font-mono text-[11px] text-zinc-400 leading-relaxed">
              {tip.example}
            </pre>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss daily tip"
          className="mt-0.5 flex-shrink-0 rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
