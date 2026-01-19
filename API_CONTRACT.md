/**
 * PHASE 2: LLM Review API Contract
 * 
 * This file documents the exact API interface for easy reference
 */

// REQUEST
POST /api/review
Content-Type: application/json

{
  "code": "string (required) - The source code to review",
  "language": "string (required) - One of: javascript, python, java, c",
  "verbosity": "string (optional) - 'quick' or 'deep'. Default: 'quick'"
}

// RESPONSE (200 OK)
{
  "overallScore": 0-100,
  "scoreBreakdown": {
    "descriptiveNaming": 0-100,
    "functionSize": 0-100,
    "explicitDependencies": 0-100,
    "errorHandling": 0-100,
    "controlFlow": 0-100,
    "sideEffects": 0-100,
    "magicNumbers": 0-100
  },
  "summary": "Coach-style feedback",
  "suggestions": [
    {
      "principle": "descriptiveNaming|functionSize|explicitDependencies|errorHandling|controlFlow|sideEffects|magicNumbers",
      "severity": "critical|major|minor",
      "message": "Explanation of issue",
      "codeSnippet": "The problematic code",
      "suggestedFix": "How to improve it",
      "lineRange": { "start": 1, "end": 5 }
    }
  ],
  "language": "javascript|python|java|c",
  "reviewedAt": "2024-01-19T12:00:00.000Z"
}

// ERROR RESPONSES
400 Bad Request
{ "error": "Missing required fields: code and language" }

400 Bad Request
{ "error": "Unsupported language. Supported: javascript, python, java, c" }

500 Internal Server Error
{ "error": "LLM API error: ..." }

// EXAMPLE USAGE

// JavaScript/TypeScript
const review = await fetch('/api/review', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function sum(a, b) { return a + b; }',
    language: 'javascript',
    verbosity: 'deep'
  })
}).then(r => r.json());

// Python (requests library)
import requests
response = requests.post(
  'http://localhost:3000/api/review',
  json={
    'code': 'def sum(a, b):\n    return a + b',
    'language': 'python',
    'verbosity': 'quick'
  }
)
review = response.json()

// INTEGRATION WITH USEREVVIEW HOOK (Phase 3)

import { useReview } from '@/hooks/useReview';

export function ReviewComponent() {
  const { review, loading, error, submitReview } = useReview();

  const handleSubmit = async () => {
    await submitReview({
      code: '...',
      language: 'javascript'
    });
  };

  if (loading) return <div>Reviewing...</div>;
  if (error) return <div>Error: {error}</div>;
  if (review) return <ReviewDisplay review={review} />;

  return <button onClick={handleSubmit}>Submit Code</button>;
}
