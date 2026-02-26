import { NextRequest, NextResponse } from "next/server";

type Provider = "ollama" | "lmstudio";
type MessageRole = "user" | "assistant" | "system";

interface ChatMessage {
  role: MessageRole;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  provider?: Provider;
  model?: string;
  codeContext?: string;
  language?: string;
}

const defaultProvider = (process.env.AI_PROVIDER || "ollama").toLowerCase() as Provider;
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const lmStudioBaseUrl = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234";

function getDefaultModel(provider: Provider) {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (provider === "lmstudio") return process.env.LMSTUDIO_MODEL || "lmstudio-model";
  return process.env.OLLAMA_MODEL || "llama3.1:8b-instruct";
}

function buildSystemPrompt(codeContext?: string, language?: string): string {
  const base = `You are a friendly, expert coding coach and mentor. You help developers understand code quality, best practices, design patterns, and software engineering concepts. Keep responses concise but thorough. Use code examples when helpful. Be encouraging and constructive.`;

  if (codeContext) {
    return `${base}

The user is currently working on the following ${language || "code"}:
\`\`\`${language || ""}
${codeContext}
\`\`\`

You can reference this code in your answers when relevant.`;
  }

  return base;
}

async function callOllama(messages: ChatMessage[], model: string) {
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content || "";
}

async function callLmStudio(messages: ChatMessage[], model: string) {
  const response = await fetch(`${lmStudioBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
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
    const body = (await request.json()) as ChatRequest;
    const { messages, codeContext, language } = body;

    const provider = (body.provider || defaultProvider) as Provider;
    const model = body.model || getDefaultModel(provider);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: messages" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(codeContext, language);
    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const responseText =
      provider === "lmstudio"
        ? await callLmStudio(fullMessages, model)
        : await callOllama(fullMessages, model);

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
