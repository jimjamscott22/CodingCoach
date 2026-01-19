# Environment Setup for Phase 2

## Prerequisites

You need a local LLM running via Ollama or LM Studio.

### Option A: Ollama

1. Install Ollama: [https://ollama.com](https://ollama.com)
1. Pull a model (example): `ollama pull llama3.1:8b-instruct`
1. Make sure Ollama is running at `http://localhost:11434`

### Option B: LM Studio

1. Install LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
1. Download and load a chat model
1. Start the local server (OpenAI-compatible) at `http://localhost:1234`

## Local Environment Variables

Create a `.env.local` file in the project root:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b-instruct

# OR use LM Studio
# AI_PROVIDER=lmstudio
# LMSTUDIO_BASE_URL=http://localhost:1234
# LMSTUDIO_MODEL=your-model-id

# Optional override for either provider
# AI_MODEL=your-model-id
```

## Installation

Install the new dependency:

```bash
npm install
# or
pnpm install
# or
yarn install
```

## Testing the API

Once the app is running (`pnpm dev`), you can test the `/api/review` endpoint:

### Using curl

```bash
curl -X POST http://localhost:3000/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript",
    "verbosity": "quick"
  }'
```

### Using fetch in JavaScript

```javascript
const response = await fetch('/api/review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function add(a, b) { return a + b; }',
    language: 'javascript',
    verbosity: 'quick'
  })
});

const review = await response.json();
console.log(review);
```

## Response Schema

The endpoint returns a JSON object with this structure:

```json
{
  "overallScore": 75,
  "scoreBreakdown": {
    "descriptiveNaming": 80,
    "functionSize": 90,
    "explicitDependencies": 85,
    "errorHandling": 60,
    "controlFlow": 80,
    "sideEffects": 85,
    "magicNumbers": 90
  },
  "summary": "Your code is concise and readable, but needs better error handling.",
  "suggestions": [
    {
      "principle": "errorHandling",
      "severity": "major",
      "message": "Add validation for input parameters.",
      "codeSnippet": "function add(a, b) { return a + b; }",
      "suggestedFix": "function add(a, b) {\n  if (typeof a !== 'number' || typeof b !== 'number') {\n    throw new TypeError('Arguments must be numbers');\n  }\n  return a + b;\n}",
      "lineRange": { "start": 1, "end": 1 }
    }
  ],
  "language": "javascript",
  "reviewedAt": "2024-01-19T12:00:00.000Z"
}
```

## Supported Languages

- `javascript`
- `python`
- `java`
- `c`

## Verbosity Modes

- `quick`: Brief, actionable review focusing on impactful issues
- `deep`: Detailed, comprehensive review of all principles

## Provider Health Check

Use the built-in endpoint to verify connectivity to your local LLM:

```bash
curl -X POST http://localhost:3000/api/health/provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama"}'
```

The response includes `ok`, `provider`, `baseUrl`, `model`, and `availableModels`.
