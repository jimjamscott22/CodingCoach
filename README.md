# Coding Coach

Coding Coach is an interactive code-review mentor that helps programmers improve real-world coding skills with an emphasis on production readiness, maintainability, and clarity of thought. Users can paste or upload source code (JavaScript, Python, Java, or C), send it to a local LLM (Ollama or LM Studio) for structured analysis, and receive mentor-style feedback.

## Simple PRD

### Problem

Developers want actionable, production-ready code review guidance that teaches judgment rather than enforcing rules.

### Goal

Provide fast, structured, mentor-like feedback with clear scoring, concrete examples, and measurable improvement over time.

### Target Users

- Early-career engineers leveling up code quality
- Interview candidates practicing real-world code review skills
- Students learning best practices beyond syntax
- Developers preparing code for production deployment

### Core Requirements

- Paste/upload code and get a structured review from a local LLM.
- Show overall score (0-100) plus category breakdown:
  Readability, Structure, Safety, Maintainability, Testability.
- Explain why points were lost and how to regain them.
- Provide concrete suggestions and optional refactored snippets.
- Provide a coach’s summary in a constructive tone.
- Support history and score deltas per file.
- Support quick review vs deep dive verbosity toggle.
- Highlight code sections tied to each suggestion.

### Non-Goals (for v1)

- Auto-fixing code.
- Running code or compiling within the app.
- Language coverage beyond JS, Python, Java, C.

## Evaluation Principles

The reviewer must explicitly reference these principles:

1. Descriptive Naming
2. Function Size & Responsibility
3. Explicit Dependencies
4. Error Handling Discipline
5. Control Flow Simplicity
6. Obvious Side Effects
7. Avoid Magic Numbers

## Scoring Rules

- Each principle contributes to the total score.
- The response must explain why points were lost and how to regain them.
- Scores should be fair, consistent, and teaching-oriented.

## UX Requirements

- Dark mode by default with dark gray backgrounds and soft contrast
- Blue accent buttons and highlights
- Monospace font for code display
- Syntax highlighting
- Clear separation of Score, Explanations, Suggested Fixes

## Interactive Features

- Verbosity toggle (quick review vs deep dive)
- Click suggestion to highlight the referenced code section
- Resubmit improved code and view score deltas
- History view showing progress per file

## Stretch Features

- Production Readiness Checklist
- Security and performance warnings when applicable
- Language-specific advice (Java OOP patterns, Pythonic idioms, JS async pitfalls)
- Export reviews as Markdown or PDF

## Tech Stack (Mainstream)

- Frontend/App: Next.js (React) + TypeScript
- Backend: Next.js API routes (Ollama/LM Studio integration)
- Auth + Storage + DB: Supabase
- Styling: Tailwind CSS
- Code editor: Monaco or CodeMirror with syntax highlighting

## High-Level Architecture

- UI: code editor, file upload, review dashboard, history view.
- API: `/api/review` sends prompts to a local LLM and normalizes response.
- DB: store files, reviews, suggestions, and score deltas by user.
- Storage: optional code file uploads in Supabase storage.

## Data Model (Draft)

- `users` (Supabase auth)
- `projects` (id, user_id, name)
- `files` (id, project_id, path, language, created_at)
- `reviews` (id, file_id, score, breakdown_json, summary, created_at)
- `suggestions` (id, review_id, principle, severity, message, range_json)

## Local Development (Planned)

- `pnpm install`
- `pnpm dev`
- Optional: `curl -X POST /api/health/provider` to verify local LLM connectivity.

## Environment Variables (Planned)

- `AI_PROVIDER` (ollama | lmstudio)
- `OLLAMA_BASE_URL` (default: <http://localhost:11434>)
- `LMSTUDIO_BASE_URL` (default: <http://localhost:1234>)
- `OLLAMA_MODEL` (default: llama3.1:8b-instruct)
- `LMSTUDIO_MODEL` (default: lmstudio-model)
- `AI_MODEL` (optional override)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Milestones

1. Scaffold Next.js app with dark UI and editor.
2. Implement `/api/review` with local LLM prompt + schema.
3. Render score breakdown, suggestions, and summary.
4. Add history, deltas, and suggestion highlighting.
5. Add provider health check and model selection UI.
6. Polish UX, export, and stretch features.

