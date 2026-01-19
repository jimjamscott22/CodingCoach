import { NextRequest, NextResponse } from "next/server";

type Provider = "ollama" | "lmstudio";

const providerDefault = (process.env.AI_PROVIDER || "ollama").toLowerCase() as Provider;
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const lmStudioBaseUrl = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234";

const defaultModel = (provider: Provider) => {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (provider === "lmstudio") return process.env.LMSTUDIO_MODEL || "lmstudio-model";
  return process.env.OLLAMA_MODEL || "llama3.1:8b-instruct";
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const provider = ((body.provider as string) || providerDefault) as Provider;
    const model = (body.model as string) || defaultModel(provider);

    if (!["ollama", "lmstudio"].includes(provider)) {
      return NextResponse.json(
        { error: "Unsupported provider. Use ollama or lmstudio." },
        { status: 400 },
      );
    }

    if (provider === "ollama") {
      const response = await fetch(`${ollamaBaseUrl}/api/tags`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama health failed: ${response.status} ${text}`);
      }

      const data = (await response.json()) as {
        models?: Array<{ name?: string }>;
      };

      const availableModels = (data.models || [])
        .map((entry) => entry.name)
        .filter((name): name is string => Boolean(name));

      return NextResponse.json({
        ok: true,
        provider,
        baseUrl: ollamaBaseUrl,
        model,
        availableModels,
        message: "Ollama reachable",
      });
    }

    const response = await fetch(`${lmStudioBaseUrl}/v1/models`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LM Studio health failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id?: string }>;
    };

    const availableModels = (data.data || [])
      .map((entry) => entry.id)
      .filter((id): id is string => Boolean(id));

    return NextResponse.json({
      ok: true,
      provider,
      baseUrl: lmStudioBaseUrl,
      model,
      availableModels,
      message: "LM Studio reachable",
    });
  } catch (error) {
    console.error("Provider health error:", error);
    const message = error instanceof Error ? error.message : "Health check failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}