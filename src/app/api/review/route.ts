import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ReviewRequest, ReviewResponse } from "@/types/review";
import { buildReviewPrompt } from "@/lib/promptBuilder";

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReviewRequest;
    const { code, language, verbosity = "quick" } = body;

    // Validate input
    if (!code || !language) {
      return NextResponse.json(
        { error: "Missing required fields: code and language" },
        { status: 400 }
      );
    }

    if (!["javascript", "python", "java", "c"].includes(language)) {
      return NextResponse.json(
        { error: "Unsupported language. Supported: javascript, python, java, c" },
        { status: 400 }
      );
    }

    if (!["quick", "deep"].includes(verbosity)) {
      return NextResponse.json(
        { error: "Invalid verbosity. Must be 'quick' or 'deep'" },
        { status: 400 }
      );
    }

    // Build the prompt
    const prompt = buildReviewPrompt(code, language, verbosity);

    // Call Claude API
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Claude response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse Claude response as JSON" },
        { status: 500 }
      );
    }

    // Build the final response
    const reviewResponse: ReviewResponse = {
      overallScore: parsedResponse.overallScore,
      scoreBreakdown: parsedResponse.scoreBreakdown,
      summary: parsedResponse.summary,
      suggestions: parsedResponse.suggestions || [],
      language,
      reviewedAt: new Date().toISOString(),
    };

    return NextResponse.json(reviewResponse);
  } catch (error) {
    console.error("Review API error:", error);

    // Handle specific Anthropic errors
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
