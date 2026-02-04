import { NextRequest, NextResponse } from "next/server";
import { ReviewRequest, ReviewResponse } from "@/types/review";
import { buildReviewPrompt } from "@/lib/promptBuilder";

type Provider = "ollama" | "lmstudio";

const defaultProvider = (process.env.AI_PROVIDER || "ollama").toLowerCase() as Provider;
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const lmStudioBaseUrl = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234";

function getDefaultModel(provider: Provider) {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (provider === "lmstudio") return process.env.LMSTUDIO_MODEL || "lmstudio-model";
  return process.env.OLLAMA_MODEL || "llama3.1:8b-instruct";
}

function extractJson(text: string) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const slice = text.slice(firstBrace, lastBrace + 1).trim();
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

async function callOllama(prompt: string, model: string) {
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    message?: { content?: string };
  };

  return data.message?.content || "";
}

async function callLmStudio(prompt: string, model: string) {
  const response = await fetch(`${lmStudioBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LM Studio error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content || "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReviewRequest & { provider?: Provider; model?: string };
    const { code, language, verbosity = "quick" } = body;

    // Get provider and model from request or use defaults
    const provider = (body.provider || defaultProvider) as Provider;
    const model = body.model || getDefaultModel(provider);

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

    // Call local LLM provider
    const responseText =
      provider === "lmstudio"
        ? await callLmStudio(prompt, model)
        : await callOllama(prompt, model);

    // Parse the JSON response
    const parsedResponse = extractJson(responseText);
    if (!parsedResponse) {
      console.error("Failed to parse LLM response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse LLM response as JSON" },
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
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
