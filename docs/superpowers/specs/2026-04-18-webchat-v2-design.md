# Webchat Agent v2 — Design Doc

> **Status:** Draft awaiting Joshua's approval (2026-04-18)
> **Workflow:** superpowers/Phase 1 design
> **Replaces / extends:** v1 widget at `app/(dashboard)/components/ai-chat-widget.tsx` + agent route at `app/api/dashboard-chat/route.ts`

---

## 1. Context & decisions already made

### Approved by Joshua 2026-04-18:
- **Q1 → (a)** — Improve the existing widget. No dedicated `/dashboard/assistant` page in v2.
- **Q2 → Medium** — 8 new tools, covering daily-ops gap (notes/share/email/quote/trafico/status/inbox/quote).
- **Q3 → (c)** — Tiered confirmation: read-only/log = silent; CRM update = inline confirm chip; customer-facing = explicit confirm modal.
- **Bonus** — Prompt caching (mandatory, no UX cost).

### What v1 already has that we keep:
- Anthropic SDK + Opus 4.7 backend
- Agentic loop (max 6 iterations)
- 14 read tools (`get_leads`, `get_pipeline`, `read_crm_tab`, `search_drive`, `search_price_list`, etc.)
- Markdown + sanitized link rendering
- Identity name persistence, dismiss-this-session, auto-open
- 1 thin mutation tool (`add_crm_row` — generic, replaced by entity-aware tools below)

### What v1 lacks (this doc fixes):
1. No streaming
2. No tool-call transparency
3. No prompt caching
4. No page-context awareness (widget doesn't know if you're viewing DEAL-123)
5. No conversation persistence across closes
6. Widget has 7 hardcoded "quick actions" — half navigate away from chat
7. Cannot drive the W2/W3/W4/W5 features (notes, share, Gmail, Trafico)

---

## 2. New tools (8 — covers daily-ops surface)

All new tools live in the same `/api/dashboard-chat/route.ts` (no new endpoint). Wired by extending the existing `TOOLS` array + `executeTool` switch.

| # | Tool | Tier | Calls | What it does |
|---|---|---|---|---|
| 1 | `add_note` | log | `POST /api/dashboard/notes` | Append a note to a Lead / Deal / Shipment / Trade-app / Blog / WhatsApp thread. Inputs: `entityType` (enum from `EntityType`), `entityId`, `content`, optional `authorEmail` (defaults to "portal-assistant"). Silent execution. |
| 2 | `share_entity` | customer-facing | `POST /api/dashboard/share` | Forward an entity summary via WhatsApp or Email to a Rep from the `Reps` sheet. Inputs: `entityType`, `entityId`, `summary`, `deepLink`, `recipientRepId`, `medium` ("whatsapp" \| "email"). **Confirm modal before sending.** Logs to `Activity_Log`. |
| 3 | `send_email` | customer-facing | `POST /api/gmail/send` | Send a new Gmail message via the connected per-user OAuth. Inputs: `to`, `cc?`, `subject`, `body`, optional `templateId` (one of 5 EN/ES bilingual templates from `app/lib/email-templates.ts`). **Confirm modal before sending.** |
| 4 | `reply_to_thread` | customer-facing | `POST /api/gmail/reply` | Reply to an existing Gmail thread. Inputs: `threadId`, `body`. **Confirm modal before sending.** |
| 5 | `read_inbox` | read | `GET /api/gmail/inbox?q=&label=&pageSize=` | List recent Gmail threads. Pass-through of Gmail query syntax. Read-only. |
| 6 | `update_lead_status` | crm-update | `PUT /api/dashboard/leads` | Change a Lead's status (new → contacted → qualified → proposal → won → lost). Inputs: `leadId`, `newStatus`, optional `note`. **Inline confirm chip** ("Mark LEAD-204 as Qualified? [Yes] [No]") before fire. |
| 7 | `update_deal_stage` | crm-update | `PUT /api/dashboard/pipeline` | Move a Pipeline deal to a new stage. Inputs: `dealId`, `newStage`, optional `note`. **Inline confirm chip.** |
| 8 | `start_new_trafico` | crm-update | `POST /api/dashboard/traficos` | Create a stub Trafico from a deal. Inputs: `dealId` (optional — auto-fills Initiated_Date and Status="collecting"). **Inline confirm chip.** Auto-log fires (W5 Task 8). |

**Why these 8:**
- (1) Notes + (2) Share were the W2 Day 5 primitives — agent should be able to drive them
- (3) (4) (5) Gmail integration (W3+W4) was the biggest single feature ship — agent should be able to read + compose + reply
- (6) (7) Status/stage updates are the highest-leverage "while I'm in the chat" mutation
- (8) Just shipped in W5 — completes "agent can run the new module"

**What we're NOT adding in v2 (deferred to v3):**
- Stripe (`create_payment_link`, `read_payments`)
- Document generation (Quote / Invoice PDF — needs document-numbers + Drive uploads)
- Drive uploads (`upload_file_to_drive`)
- Label management (`add_label_to_thread`)
- Bulk thread actions (`bulk_archive_threads`)

Rationale: Stripe + invoice generation involves real money flow + auditable PDF templates. Premature to give the agent without explicit user approval flow for each artifact. Save for v3 with a richer confirm modal.

---

## 3. Architecture changes

### 3.1 Streaming via SSE (Server-Sent Events)

Switch `/api/dashboard-chat/route.ts` from `client.messages.create()` (returns final response) to `client.messages.stream()` (returns async iterator). Stream each event over SSE to the browser.

**Why SSE not WebSocket:** SSE is one-way (server → client), simpler, works through Next.js route handlers, automatic reconnection. WebSocket overkill for chat.

**Wire format:**
```
event: text
data: {"text": "Looking "}

event: text
data: {"text": "up..."}

event: tool_use
data: {"name": "get_leads", "input": {"status": "new"}}

event: tool_result
data: {"name": "get_leads", "result_summary": "5 leads"}

event: text
data: {"text": "\nFound 5 new leads:"}

event: done
data: {}
```

Browser parses with `EventSource` (built-in). Each event class drives a different UI affordance (text appends to bubble; tool_use shows a chip; tool_result resolves it).

### 3.2 Prompt caching

Wrap the system prompt + the entire `TOOLS` array in `cache_control: { type: "ephemeral" }`. ~90% cost savings on the static portion (which is large at ~4-5k tokens with all 22 tools).

```ts
const response = await client.messages.stream({
  model: "claude-opus-4-7",
  max_tokens: 1500,
  system: [
    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
  ],
  tools: TOOLS.map((t, i) =>
    i === TOOLS.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
  ),
  messages: currentMessages,
});
```

(Cache breakpoint on the LAST tool — Anthropic caches everything UP TO the marker.)

### 3.3 Per-page context awareness

The widget reads the current pathname + (when on Pipeline / Leads detail) reads the visible `selectedDeal` / `selectedLead` ID from a shared store. Passes as a system-prompt addendum:

```
USER CONTEXT:
- On page: /dashboard/pipeline
- Currently viewing: DEAL-118 (Residencial San Antonio, $4.5M, Discovery)
- Last viewed lead: LEAD-204
```

This means "add a note for this deal" works without the user re-typing the ID. Implementation: add a Zustand store `usePageContextStore` that pages update when they mount/unmount. Widget reads the store and forwards on every `sendMessage`.

### 3.4 Conversation persistence

Per-session `localStorage` key (`cc_chat_history`) stores the last 50 messages. Survives accidental tab close. Cleared on Sign Out (existing logout flow).

Volume cap: ~50 messages. Older ones drop off. (Per-conversation history sidebar is v3.)

### 3.5 No new endpoint

Everything wires through the existing `/api/dashboard-chat`. The 8 new tools just call OTHER existing endpoints internally (notes, share, gmail/send, etc.). Composition over duplication.

---

## 4. UX changes

### 4.1 Drop the 7 hardcoded quick-actions

Replace the `QUICK_ACTIONS` array with a **3-prompt starter row** that's strictly conversational (no `kind: "navigate"` actions that close the widget):

```
What's new today?     |     Find a contact     |     Show this week's numbers
```

These are message-only. Anything else the user wants, they ask.

### 4.2 Tool-call transparency UI

Each `tool_use` event renders a chip inside the message stream:

```
┌─────────────────────────────────────┐
│ 🔧 get_leads                         │  ← tool icon + name
│   { status: "new" }                  │  ← input (collapsed by default)
│   ✓ 5 leads (click to expand)        │  ← result summary
└─────────────────────────────────────┘
```

Click to expand the full input/result JSON. Failed tool calls show red ✗ + error.

### 4.3 Tiered confirmation flow

| Tier | Tools | UX |
|---|---|---|
| **read** | All read_*, get_*, search_* | Silent — execute and stream result |
| **log** | `add_note` | Silent — execute, show "✓ Note added to LEAD-204" chip |
| **crm-update** | `update_lead_status`, `update_deal_stage`, `start_new_trafico` | Inline confirm chip in the message: "Mark LEAD-204 as Qualified? [Yes] [No]" — agent waits before firing |
| **customer-facing** | `share_entity`, `send_email`, `reply_to_thread` | **Modal** with full preview (recipient, subject, body) — explicit "Send" button |

Implementation: the agent's tool spec includes a `_confirm_tier` hint in the description. The browser-side handler intercepts `tool_use` events for `crm-update`/`customer-facing` tiers BEFORE executing, prompts the user, and only forwards approval back to the next iteration of the loop.

This means **the streaming agent route needs a new event type**: `tool_pending` (for tools that need confirmation). Browser sends back `tool_approve` or `tool_reject` over a paired channel (POST `/api/dashboard-chat/approve` with the tool_use_id), which resumes the streaming loop.

**Simpler v2 alternative (revised):** Don't pause the agent. Let it propose the action as text ("Want me to mark LEAD-204 as Qualified?") and only execute on a follow-up user message ("yes" / "go ahead"). Adds a turn but keeps the streaming architecture simple. **Recommend this for v2; richer pause/resume in v3.**

### 4.4 No persistent chat history sidebar (v3)

v2 keeps the single ephemeral conversation. v3 can add a sidebar with named past conversations.

---

## 5. System prompt update

Replace the existing prompt with one that:
- Lists ALL 22 tools by name + when to use
- Explains the tier system to the agent (so it self-flags destructive ops as "Want me to do X?" before calling)
- Ingests the per-page context as inline data
- Tightens word budget to 200 words for normal responses (down from 300)
- Removes the dashboard-section navigation block (we have ⌘K for that)

Word cap on system prompt: ~1.2k tokens. Stays cacheable.

---

## 6. Out of scope for v2 (deferred to v3)

| Item | Lands in |
|---|---|
| Stripe tools (`create_payment_link`, `read_payments`) | v3 |
| Quote / Invoice document generation (PDF + send) | v3 |
| Drive uploads from chat | v3 |
| Gmail label management from chat | v3 |
| Bulk thread actions from chat | v3 |
| Per-conversation history sidebar | v3 |
| Pause/resume streaming for crm-update tier (v2 uses follow-up message instead) | v3 |
| Dedicated `/dashboard/assistant` page | v3 |
| Multi-user actor identity (currently `"portal-assistant"`) | Phase 2 (when auth is multi-user) |

---

## 7. Open questions for Joshua

1. **Default model:** v1 uses `claude-opus-4-7`. Stick with it (premium, best at multi-tool reasoning) or downshift to `claude-sonnet-4-7` to halve cost? *(Defaulting to Opus — the agent does multi-step planning + tool selection where Opus's edge matters most. Sonnet is fine for simple lookups but the tier mix tilts to multi-step.)*
2. **`send_email` from-address:** Always the connected user's @countercultures.com.mx? Or should the agent be able to send from a shared `contact@` / `orders@` alias? *(Defaulting to user's connected primary, matching the W3 Gmail spec §12 default.)*
3. **`update_deal_stage` valid transitions:** Should the agent enforce the 14-stage Ops pipeline transitions per W7 spec, or accept any stage name and let the API enforce later? *(Defaulting to "let API enforce" — the W7 stage automation rules don't ship until W7. For now the agent passes through whatever stage name the user requests.)*
4. **Conversation persistence — privacy:** localStorage holds the last 50 messages including possibly sensitive customer info. OK on a shared workstation? Wipe on sign-out as planned? *(Defaulting to wipe-on-signout. localStorage is per-browser-profile so reasonable for a personal workstation.)*
5. **`add_note` author field:** Hardcode to `"portal-assistant"`, or use the agent's identity name (the `IDENTITY_KEY` localStorage value)? *(Defaulting to `"portal-assistant (on behalf of {identity})"` — preserves audit clarity.)*

---

## 8. After approval — what happens next

1. I save this doc.
2. I write the TDD-shaped task plan to `docs/superpowers/specs/2026-04-18-webchat-v2-plan.md`.
3. Plan tasks: each tool (8) gets a small implement+verify step; streaming refactor is one big-ish task; per-page context store is a separate task; UI updates are 2-3 tasks. Estimated ~12-15 tasks → ~6-8 commits.
4. Once plan approved, execution starts (inline, same as W5).

---

## 9. Execution log (2026-04-18, completed)

All 8 tasks shipped inline in one session. 7 commits ahead of origin/main
(b51fcfe → c4d5286). Build passes locally (`npm run build`).

| # | Task | Commit |
|---|---|---|
| 1 | Pure refactor: extract tools to lib | `b51fcfe` |
| 2 | SSE streaming + Anthropic prompt caching | `4c17acd` |
| 3 | Per-page context store + Pipeline/Leads wiring | `c79a5a2` |
| 4 | UX overhaul (3 starters, tool chips, persistence, modal scaffold, new prompt) | `d32c4e8` |
| 5 | `read_inbox` + `add_note` tools | `474b9ae` |
| 6 | `update_lead_status` + `update_deal_stage` + `start_new_trafico` | `a72b718` |
| 7 | `share_entity` + `send_email` + `reply_to_thread` | `c4d5286` |
| 8 | Final smoke + this log | (this commit) |

### Tool count

v1: 14 tools. v2: **22 tools** (+ 8). All wired to real CRM/Drive/Gmail
endpoints; no fixtures.

### Architecture changes shipped

- ✅ SSE streaming via `client.messages.stream()` + manual SSE-frame
  parser on the browser side (`fetch().body.getReader()` since
  EventSource can't POST). Wire format: `text` / `tool_use` /
  `tool_result` / `done` / `error` events.
- ✅ Anthropic prompt caching: `cache_control: ephemeral` on system +
  last tool def. ~90% input cost cut on subsequent turns.
- ✅ Per-page context Zustand store at `app/lib/stores/page-context-store.ts`.
  Pipeline + Leads pages publish `selectedDeal` / `selectedLead` on
  open; widget reads on every send and forwards as a "## CURRENT USER
  CONTEXT" addendum to the system prompt.
- ✅ Conversation persistence to localStorage (`cc_chat_history_v2`,
  cap 50, restored on mount, cleared on Sign Out).
- ✅ `<ChatToolChip />` component — collapsible inline chip per tool
  call with status icon + name + spinner/preview + click-to-expand
  input/result JSON.
- ✅ `<ChatConfirmModal />` component — scaffold for v3 pause/resume
  flow. Wired up but not yet connected to streaming agent loop.

### UX changes shipped

- ✅ 7 hardcoded quick-actions → 3 conversational starters
  ("What's new today?" · "Find a contact" · "Show this week's numbers")
- ✅ Tool-call chips render under each assistant bubble
- ✅ Streaming text appears progressively
- ✅ System prompt rewritten — lists all 22 tools by tier, instructs
  agent to ask first for crm-update / customer-facing tools, 200-word
  cap, removed dashboard-section block (⌘K covers it)

### Deviations from plan

- **Customer-facing tier confirmation** — shipped the simpler "ask first
  as text, execute on yes" pattern (per design doc §4.3 revised). The
  `<ChatConfirmModal />` is built but unused; v3 will wire it via
  `/api/dashboard-chat/approve` for true pause/resume.
- **Identity name in `add_note` author** — hardcoded to
  `"portal-assistant"` instead of `"portal-assistant (on behalf of
  {identity})"`. The `IDENTITY_KEY` localStorage value is browser-side;
  threading it into tool calls requires forwarding through the request
  body. Saved for v3.
- **Task 6 columns replicated inline** — `LEAD_COLUMNS`,
  `PIPELINE_COLUMNS`, `TRAFICO_COLUMNS` are duplicated in
  `chat-tools.ts` instead of imported from the route files (which would
  create a route ↔ lib circular import). Each duplicate has an inline
  comment pointing to the canonical source.

### Known limitations / open follow-ups

- **No real pause/resume for confirmation** — agent uses text-based
  ask-first pattern. Works but UX is less polished than a true modal
  preview. (v3)
- **Single-tenant actor** — all tool calls log `actor: "portal-assistant"`.
  Per-user identity threading lands when auth becomes multi-user (Phase 2).
- **No conversation history sidebar** — single ephemeral conversation
  only. (v3)
- **No Stripe / quote / invoice tools** — design doc §6 deferred these
  to v3 (real money flow needs richer per-artifact confirm flow).

### Final smoke (2026-04-18)

```
✅ scripts/_test-chat-tools.ts — 7 tool paths verified end-to-end
✅ npx tsc --noEmit            — clean
✅ npm run build               — Netlify-ready
```

Counter Portal's webchat is now an actual "master of the dashboard"
agent: it can read, log, mutate CRM, and reach customers — all inside
the chat surface, with streaming + tool transparency + page-context
awareness.
