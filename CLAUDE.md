# CLAUDE.md - Coding Coach

This file provides context for AI assistants working with this codebase.

## Project Overview

Coding Coach is an interactive code-review mentor application that analyzes code submissions against 7 production-readiness principles and provides structured feedback with scoring (0-100), concrete suggestions, and coach-style summaries.

**Target users:** Early-career engineers, interview candidates, students learning best practices.

## Tech Stack

- **Framework:** Next.js 16 with App Router (React 19)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Code Editor:** CodeMirror (@uiw/react-codemirror)
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Supabase Auth (email/password)
- **LLM Integration:** Ollama or LM Studio (local providers)
- **Deployment:** Docker (standalone Next.js output)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── review/route.ts         # Main code review endpoint
│   │   └── health/provider/route.ts # LLM provider health check
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page (UI orchestrator)
├── components/            # React components
│   ├── ScoreCard.tsx      # Review scores display
│   ├── CoachSummary.tsx   # Mentor feedback summary
│   ├── SuggestionsPanel.tsx # Improvement suggestions
│   ├── ReviewHistory.tsx  # Past reviews
│   └── AuthModal.tsx      # Authentication modal
├── hooks/                 # Custom React hooks
│   ├── useReview.ts       # Review submission & persistence
│   ├── useAuth.ts         # Auth state management
│   └── useReviewHistory.ts # Fetch past reviews
├── lib/                   # Utilities
│   ├── supabase.ts        # Client-side Supabase
│   ├── supabaseServer.ts  # Server-side Supabase
│   ├── promptBuilder.ts   # LLM prompt generation
│   └── database/          # DB operations (files.ts, reviews.ts, suggestions.ts)
└── types/                 # TypeScript definitions
    ├── review.ts          # Review types
    └── database.ts        # Supabase table types

supabase/migrations/       # Database schema with RLS policies
```

## Key Conventions

### Naming
- Components: `PascalCase` (ScoreCard.tsx)
- Functions/hooks: `camelCase` (useReview, buildReviewPrompt)
- Types: `PascalCase` (ReviewResponse, ScoreBreakdown)
- Files: `PascalCase` for components, `kebab-case` for routes

### Patterns
- All UI components use `"use client"` directive
- Props defined via TypeScript interfaces
- Custom hooks for data fetching and state (useReview, useAuth)
- Supabase clients separated: `supabase.ts` (client), `supabaseServer.ts` (server)
- Path alias: `@/*` maps to `src/*`

### Error Handling
- Try-catch with `err instanceof Error` guards
- Fallback UI states (loading, error, empty)
- Console error logging for debugging

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint check
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
AI_PROVIDER=ollama  # or lmstudio
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b-instruct
```

## Database Schema

Three main tables with RLS enabled:
- **files:** Code submissions (user_id, name, language, content)
- **reviews:** Review results (file_id, scores, summary, verbosity)
- **suggestions:** Individual suggestions (review_id, principle, severity, message, code snippets)

User isolation enforced via RLS policies - users only access their own data.

## API Endpoints

### POST /api/review
Submits code for review.
- Input: `{ code, language, verbosity?: "quick"|"deep" }`
- Output: `{ overallScore, scoreBreakdown, summary, suggestions[], reviewedAt }`

### POST /api/health/provider
Checks LLM provider status.
- Input: `{ provider: "ollama"|"lmstudio", model? }`
- Output: `{ ok, provider, availableModels[], message }`

## 7 Evaluation Principles

Code is scored against:
1. Descriptive Naming
2. Function Size & Responsibility
3. Explicit Dependencies
4. Error Handling Discipline
5. Control Flow Simplicity
6. Obvious Side Effects
7. Avoid Magic Numbers

## Development Notes

- LLM provider (Ollama/LM Studio) must be running locally for reviews
- Supabase project required for auth and data persistence
- Docker support via `docker-compose up --build`
- UI uses dark theme throughout
