#!/usr/bin/env node

/**
 * Quick test script for the /api/review endpoint
 * Run this after `pnpm dev` to verify the API works
 * 
 * Usage: npx ts-node test-review-api.ts
 * (or run the curl examples in PHASE_2_SETUP.md)
 */

const BASE_URL = "http://localhost:3000";

const testCases = [
  {
    name: "Simple JavaScript Function (Quick Review)",
    request: {
      code: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`,
      language: "javascript",
      verbosity: "quick",
    },
  },
  {
    name: "Python Function with Error Handling",
    request: {
      code: `def divide(a, b):
    if b == 0:
        raise ValueError("Division by zero")
    return a / b`,
      language: "python",
      verbosity: "quick",
    },
  },
  {
    name: "Java Class (Deep Review)",
    request: {
      code: `public class UserService {
    private Database db;
    
    public UserService(Database db) {
        this.db = db;
    }
    
    public User getUserById(int id) {
        return db.query("SELECT * FROM users WHERE id = " + id);
    }
}`,
      language: "java",
      verbosity: "deep",
    },
  },
];

async function testApi() {
  console.log("🧪 Testing /api/review endpoint...\n");

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log("---");

    try {
      const response = await fetch(`${BASE_URL}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCase.request),
      });

      if (!response.ok) {
        console.error(`❌ Error: ${response.status}`);
        console.error(await response.text());
        continue;
      }

      const review = await response.json();

      console.log(`✅ Overall Score: ${review.overallScore}/100`);
      console.log(`📊 Score Breakdown:`);
      Object.entries(review.scoreBreakdown).forEach(([key, score]) => {
        console.log(`   - ${key}: ${score}/100`);
      });
      console.log(`💬 Summary: ${review.summary.substring(0, 100)}...`);
      console.log(`📌 Suggestions: ${review.suggestions.length} items`);
      console.log("");
    } catch (error) {
      console.error(`❌ Request failed: ${error}`);
      console.log(
        "Make sure you're running 'pnpm dev' and have ANTHROPIC_API_KEY set\n"
      );
    }
  }
}

testApi();
