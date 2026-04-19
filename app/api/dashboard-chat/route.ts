/**
 * Dashboard chat agent — HTTP route handler.
 *
 * Tool defs + executor live in app/lib/chat-tools.ts (extracted W6 v2
 * refactor). This route is just the agentic loop + transport.
 *
 * Streaming via SSE + prompt caching ships in webchat-v2 Task 2.
 * For now: kept as the v1 non-streaming JSON response shape so the
 * existing widget keeps working until Task 2 swaps both ends.
 */

import Anthropic from "@anthropic-ai/sdk";
import { TOOLS, executeTool, SYSTEM_PROMPT } from "@/app/lib/chat-tools";

export const POST = async (request: Request) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "AI assistant is not configured. Add ANTHROPIC_API_KEY to your environment variables.",
        },
        { status: 503 }
      );
    }

    const { messages } = (await request.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages?.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    // Run the agentic loop — Claude may call tools multiple times
    let currentMessages: Anthropic.Messages.MessageParam[] = messages.map(
      (m) => ({ role: m.role, content: m.content })
    );
    let iterations = 0;
    const MAX_ITERATIONS = 6; // safety limit

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages,
      });

      // If no tool use, extract text and return
      if (
        response.stop_reason === "end_turn" ||
        !response.content.some((b) => b.type === "tool_use")
      ) {
        const text = response.content
          .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");

        return Response.json({
          message: text || "I processed that but have nothing to add.",
        });
      }

      // Handle tool calls
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Add assistant response + tool results to conversation
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
    }

    // If we hit max iterations, return what we have
    return Response.json({
      message:
        "I ran into a lot of steps trying to answer that. Could you try a more specific question?",
    });
  } catch (err) {
    console.error("[Dashboard Chat]", err);
    return Response.json({ error: "Failed to respond" }, { status: 500 });
  }
};
