# Environment Setup for Phase 2

## Prerequisites

You need an Anthropic API key to use the Claude API. If you don't have one yet:

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy it (you won't be able to see it again)

## Local Environment Variables

Create a `.env.local` file in the project root:

```bash
ANTHROPIC_API_KEY=your_api_key_here
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

### Using curl:

```bash
curl -X POST http://localhost:3000/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript",
    "verbosity": "quick"
  }'
```

### Using fetch in JavaScript:

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
