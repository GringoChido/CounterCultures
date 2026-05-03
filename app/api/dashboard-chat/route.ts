/**
 * Dashboard chat agent — HTTP route handler.
 *
 * Tool defs + executor live in app/lib/chat-tools.ts.
 *
 * v2 (2026-04-18): streaming via SSE + Anthropic prompt caching.
 * Wire format (text/event-stream):
 *   event: text          data: {"text": "<delta>"}
 *   event: tool_use      data: {"id":"<id>","name":"<name>","input":{...}}
 *   event: tool_result   data: {"id":"<id>","name":"<name>","preview":"<≤120 chars>"}
 *   event: done          data: {}
 *   event: error         data: {"message":"<err>"}
 *
 * The browser parses with a small SSE-frame reader (EventSource doesn't
 * support POST). See app/(dashboard)/components/ai-chat-widget.tsx.
 */

import Anthropic from "@anthropic-ai/sdk";
import { TOOLS, executeTool, SYSTEM_PROMPT } from "@/app/lib/chat-tools";

const enc = new TextEncoder();

const sseEvent = (event: string, data: unknown): Uint8Array =>
  enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

export const POST = async (request: Request) => {
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

  const { messages, pageContext, attachments } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    pageContext?: string;
    attachments?: { name: string; mediaType: string; data: string }[];
  };

  if (!messages?.length) {
    return Response.json({ error: "No messages" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Cache the static portion (system prompt + tool defs) for ~90% input
  // cost savings on subsequent turns. Cache breakpoint = LAST tool def.
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    {
      type: "text",
      text: pageContext
        ? `${SYSTEM_PROMPT}\n\n## CURRENT USER CONTEXT\n${pageContext}`
        : SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];

  const cachedTools: Anthropic.Messages.Tool[] = TOOLS.map((t, i) =>
    i === TOOLS.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
  );

  let currentMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // If the latest user turn includes attachments, rebuild it as a content
  // array with image/document blocks so Claude can actually see them.
  if (attachments && attachments.length > 0 && currentMessages.length > 0) {
    const last = currentMessages[currentMessages.length - 1]!;
    if (last.role === "user" && typeof last.content === "string") {
      const blocks: Anthropic.Messages.ContentBlockParam[] = [];
      for (const f of attachments) {
        if (f.mediaType.startsWith("image/")) {
          blocks.push({
            type: "image",
            source: {
              type: "base64",
              media_type: f.mediaType as
                | "image/png"
                | "image/jpeg"
                | "image/gif"
                | "image/webp",
              data: f.data,
            },
          });
        } else if (f.mediaType === "application/pdf") {
          blocks.push({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: f.data,
            },
            title: f.name,
          });
        }
      }
      if (last.content.trim()) {
        blocks.push({ type: "text", text: last.content });
      } else {
        blocks.push({
          type: "text",
          text: "Please review the attached file(s).",
        });
      }
      currentMessages[currentMessages.length - 1] = {
        role: "user",
        content: blocks,
      };
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(sseEvent(event, data));

      try {
        const MAX_ITERATIONS = 6;
        let iter = 0;

        while (iter < MAX_ITERATIONS) {
          iter++;

          // Streaming call — Claude emits text deltas + tool_use blocks
          const apiStream = client.messages.stream({
            model: "claude-opus-4-7",
            max_tokens: 1500,
            system: systemBlocks,
            tools: cachedTools,
            messages: currentMessages,
          });

          // Forward text deltas to the client as they arrive
          for await (const event of apiStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              send("text", { text: event.delta.text });
            }
          }

          const final = await apiStream.finalMessage();

          // If no tool use, we're done
          if (
            final.stop_reason === "end_turn" ||
            !final.content.some((b) => b.type === "tool_use")
          ) {
            send("done", {});
            controller.close();
            return;
          }

          // Execute every tool_use block; emit chips for each
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type === "tool_use") {
              send("tool_use", {
                id: block.id,
                name: block.name,
                input: block.input,
              });
              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>
              );
              const preview =
                result.length > 120
                  ? `${result.slice(0, 117).replace(/\n/g, " ")}…`
                  : result.replace(/\n/g, " ");
              send("tool_result", {
                id: block.id,
                name: block.name,
                preview,
              });
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
          }

          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: final.content },
            { role: "user", content: toolResults },
          ];
        }

        // Hit the iteration limit
        send("text", {
          text: "\n\n_Hit the tool-call limit on this turn. Try a more specific question._",
        });
        send("done", {});
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream_failed";
        console.error("[Dashboard Chat]", msg);
        send("error", { message: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
