import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { loadNarrativeContext } from "@/lib/narrative-lookup";
import { buildDraftPrompt, isDraftTarget, type RoadmapItem } from "@/lib/narrative-ai-draft";

const MODEL = "claude-sonnet-5";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueKey: string }> }
) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { uniqueKey } = await params;
    const context = await loadNarrativeContext(uniqueKey);
    if (context instanceof NextResponse) return context;
    const { report, contextAnswers } = context;

    const body = await req.json();
    const target = body?.target;
    if (!isDraftTarget(target)) {
      return NextResponse.json({ error: `Invalid draft target: ${target}.` }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI drafting is not configured. Set ANTHROPIC_API_KEY on the server." },
        { status: 500 }
      );
    }

    const spec = buildDraftPrompt(target, { report, contextAnswers });
    const anthropic = new Anthropic();

    if (spec.kind === "roadmap") {
      let response;
      try {
        response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 2048,
          thinking: { type: "disabled" },
          system: spec.system,
          messages: [{ role: "user", content: spec.user }],
          tools: [spec.tool],
          tool_choice: { type: "tool", name: spec.tool.name },
        });
      } catch {
        return NextResponse.json(
          { error: "The AI draft request failed. Try again." },
          { status: 502 }
        );
      }

      const toolUse = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      if (!toolUse) {
        return NextResponse.json(
          { error: "Received an unexpected response from the AI model." },
          { status: 502 }
        );
      }

      const { items } = toolUse.input as { items: RoadmapItem[] };
      return NextResponse.json({ roadmap: items }, { status: 200 });
    }

    let response;
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        thinking: { type: "disabled" },
        system: spec.system,
        messages: [{ role: "user", content: spec.user }],
      });
    } catch {
      return NextResponse.json(
        { error: "The AI draft request failed. Try again." },
        { status: 502 }
      );
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "Received an unexpected response from the AI model." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: textBlock.text }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to draft narrative content: ${message}` },
      { status: 500 }
    );
  }
}
