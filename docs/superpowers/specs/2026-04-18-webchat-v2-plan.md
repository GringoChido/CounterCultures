# Webchat Agent v2 — Implementation Plan

> **Status:** Draft awaiting Joshua's approval (2026-04-18)
> **Workflow:** superpowers/Phase 2 plan
> **Design:** `2026-04-18-webchat-v2-design.md` (approved 2026-04-18)
> **TDD style:** project precedent — `scripts/_test-*.ts` for backend tools, browser-preview eval for streaming + UI

---

## Files this plan touches

```
app/api/dashboard-chat/route.ts                            (refactor + 8 new tool defs)
app/(dashboard)/components/ai-chat-widget.tsx              (UX overhaul)
app/(dashboard)/components/chat-tool-chip.tsx              (NEW)
app/(dashboard)/components/chat-confirm-modal.tsx          (NEW)
app/lib/stores/page-context-store.ts                       (NEW Zustand)
app/lib/chat-tools.ts                                       (NEW — extracted tool defs + executors)
app/(dashboard)/dashboard/(portal)/pipeline/page.tsx        (page-context wiring)
app/(dashboard)/dashboard/(portal)/leads/page.tsx           (page-context wiring)
scripts/_test-chat-tools.ts                                 (NEW)
```

## Foundational ordering

Streaming refactor is the most invasive. Do it FIRST so all subsequent tool work runs on the v2 shape (no double-implementation).

---

## Task 1 — Extract tool defs + executor into `app/lib/chat-tools.ts`

**Why first:** the existing `route.ts` is 686 lines mixing tool defs, executor, and HTTP handler. Unbundling makes streaming refactor + adding 8 tools tractable. Pure refactor — zero behavior change.

**Action:**
- Create `app/lib/chat-tools.ts`
- Move the `TOOLS` array + `executeTool` function + small helper imports out of `route.ts` and into the lib
- Re-export from lib; `route.ts` imports them
- Verify v1 widget still works end-to-end (browser eval: send a message, get a response)

**Verify:**
- `npx tsc --noEmit` clean
- Browser preview: open chat widget, send "show me leads created today" — response identical to pre-refactor

**Commit:** `refactor(chat): extract tool defs + executor to app/lib/chat-tools.ts (no behavior change)`

---

## Task 2 — Stream the agentic loop via SSE + add prompt caching

**Action:**
- Refactor `POST /api/dashboard-chat/route.ts` to return `text/event-stream`
- Use `client.messages.stream()` instead of `client.messages.create()`
- Emit events: `text` (delta), `tool_use` (start), `tool_result` (post-execute), `done`, `error`
- Add `cache_control: { type: "ephemeral" }` to system prompt + last tool def (Anthropic prompt caching)
- Refactor browser side: replace `await fetch().then(json)` with `EventSource`-style consumption (use `ReadableStream` reader since we're POSTing — `fetch().then(r => r.body.getReader())`, parse `data: {...}\n\n` chunks manually)

**Test (browser eval):**
- Open widget, send "show me leads created today"
- Confirm visible streaming (text appears progressively, not in one drop)
- Confirm tool_use chip renders briefly (placeholder render until Task 5 polishes it)
- Check Network tab: response is `text/event-stream`, multiple chunks
- Re-send same message: cache hit registers in Anthropic console (~90% cost on input cached portion)

**Commit:** `feat(chat): stream responses via SSE + Anthropic prompt caching`

---

## Task 3 — Per-page context Zustand store

**Action:**
- Create `app/lib/stores/page-context-store.ts` with shape:
  ```ts
  interface PageContext {
    pathname: string;
    selectedDeal?: { id: string; name: string; company: string; stage: string };
    selectedLead?: { id: string; name: string; status: string };
  }
  ```
- Export `usePageContextStore = create<...>(...)`
- Wire to Pipeline page: when `selectedDeal` changes, call `setSelectedDeal()`
- Wire to Leads page: when row opens, call `setSelectedLead()`
- Widget reads the store on every `sendMessage`, prepends a small "USER CONTEXT:" block to the message body

**Verify (browser eval):**
- Open Pipeline, click a deal, open chat, type "add a note: testing context awareness"
- Agent's add_note call should use the open deal's ID without the user typing it
- (Tool doesn't exist yet so the agent should say "I would call add_note with entityId=DEAL-XXX, but that tool isn't available yet")

**Commit:** `feat(chat): per-page context store — agent knows the open deal/lead`

---

## Task 4 — UX overhaul: 3 starters + tool-call chips + conversation persistence + confirmation modal + system prompt update

Bundle because they're tightly coupled (widget refactor touches everything).

**Action:**
- Replace `QUICK_ACTIONS` array of 7 with 3 conversational message-only prompts:
  - "What's new today?"
  - "Find a contact"
  - "Show this week's numbers"
- Build `<ChatToolChip />` component — renders inline in the message stream when a `tool_use` event arrives. Collapsed by default, click to expand input/result JSON. Shows status (running / ok / error).
- Add localStorage persistence: save last 50 messages on every `setMessages`, restore on mount, clear on sign-out (extend existing `cc-portal-session` clear path)
- Build `<ChatConfirmModal />` for the customer-facing tier — preview recipient/subject/body, "Send" / "Cancel"
- Update `SYSTEM_PROMPT` with the v2 spec from design doc §5: lists all 22 tools, explains tier system, ingests page-context, 200-word response cap, drop dashboard-section block

**Verify (browser eval):**
- Widget shows 3 starters, not 7
- Send "what's new today" → tool chips render with collapsed JSON
- Click chip → expands
- Refresh page → conversation persists
- Sign out → conversation cleared

**Commit:** `feat(chat): widget UX v2 — 3 starters, tool chips, persistence, confirm modal, new system prompt`

---

## Task 5 — Add read + log tier tools (read_inbox, add_note)

**Action:**
Extend `app/lib/chat-tools.ts`:

```ts
// Tool def
{
  name: "read_inbox",
  description: "List recent Gmail threads from the connected user's inbox. Pass-through of Gmail query syntax (from:, subject:, has:attachment, label:). Read-only.",
  input_schema: {
    type: "object",
    properties: {
      q: { type: "string", description: "Gmail query (optional)" },
      label: { type: "string", description: "Label name (optional)" },
      pageSize: { type: "number", description: "Default 25, max 50" },
    },
    required: [],
  },
},
{
  name: "add_note",
  description: "Append a note to a Lead, Deal, Shipment, Trade application, Blog post, or WhatsApp thread. Use the page-context entity ID if the user says 'this deal' / 'this lead'.",
  input_schema: {
    type: "object",
    properties: {
      entityType: { type: "string", enum: ["lead", "deal", "shipment", "trade_app", "blog_post", "whatsapp_thread"] },
      entityId: { type: "string" },
      content: { type: "string" },
    },
    required: ["entityType", "entityId", "content"],
  },
},
```

executeTool cases call existing endpoints:
- `read_inbox` → fetch own portal `/api/gmail/inbox?...` (or call `getInbox()` directly from `app/lib/gmail.ts`)
- `add_note` → POST to `/api/dashboard/notes` (or call `createNote()` directly from `app/lib/notes.ts`)

Use direct lib calls (not HTTP) to avoid auth round-trips (the chat route already passed auth). Author for `add_note` defaults to `"portal-assistant (on behalf of {identity})"` from system prompt context — but for v2 just use `"portal-assistant"` (identity threading is a Task 4-related polish, defer to inline chat ID).

**Test (script):**
`scripts/_test-chat-tools.ts` — call `executeTool('add_note', {...})` directly, verify Notes sheet gains a row. Call `executeTool('read_inbox', {})`, verify shape `{messages: [...]}`.

**Verify (browser):**
Open chat on a Pipeline deal page, type "add a note: agent self-test". Confirm note appears via the Notes panel on the deal.

**Commit:** `feat(chat): add read_inbox + add_note tools`

---

## Task 6 — Add crm-update tier tools (update_lead_status, update_deal_stage, start_new_trafico)

**Action:**
3 new tools. Each:
- Tool def with explicit `_confirm_tier: "crm-update"` hint in description (informational — agent self-flags via system prompt)
- executeTool case → calls `/api/dashboard/leads PUT` / `/api/dashboard/pipeline PUT` / `/api/dashboard/traficos POST` (the existing routes work)

Per design doc §4.3 revised: agent doesn't pause-resume. Instead the system prompt instructs the agent to **propose the action as text first** ("Want me to mark LEAD-204 as Qualified?") and only execute on the user's follow-up "yes". This means the agent's first turn doesn't actually call the tool — it asks. The user replies, the agent calls the tool on the second turn.

**Test (script):**
Extend `scripts/_test-chat-tools.ts` with direct executeTool calls for each of the 3.

**Verify (browser):**
Type "mark LEAD-204 as qualified" → agent should ask first ("Want me to mark LEAD-204 as Qualified?"). Reply "yes" → agent calls update_lead_status → status changes. Confirm in Leads sheet.

**Commit:** `feat(chat): add update_lead_status + update_deal_stage + start_new_trafico (crm-update tier)`

---

## Task 7 — Add customer-facing tier tools (share_entity, send_email, reply_to_thread) + wire confirm modal

**Action:**
3 new tools. Each `_confirm_tier: "customer-facing"`.

Browser-side: when a `tool_use` event arrives for any of these 3, the widget:
1. Pauses the stream parsing (don't fire the next `text` events)
2. Shows the `<ChatConfirmModal />` with the rendered preview from the tool input
3. On user "Send" → POST to a new `/api/dashboard-chat/approve` endpoint with the `tool_use_id` and approval. Server resumes the stream, executes the tool, continues.
4. On user "Cancel" → POST to the same endpoint with rejection. Server emits a `text` event ("Cancelled.") and ends the loop.

This is a meaningful new endpoint pair (server: `/api/dashboard-chat/approve`; client-side: stream resumption logic). Architecturally bigger than crm-update tier.

**Simpler v2 alt** (from design doc §4.3): customer-facing also uses the "ask first, execute on yes" pattern. No modal, no resume endpoint. Trade-off: less rich preview, but ships in this single task instead of two.

**Decision (mine):** ship the simpler alt for v2. The modal architecture lands in v3 with proper streaming pause/resume + per-tool richer preview.

So the customer-facing tier in v2 = same as crm-update: agent proposes as text ("Want me to email gabor@arqgoded.mx with subject 'Quote follow-up' and body...?"). User replies "yes" → tool fires. (`<ChatConfirmModal />` is built in Task 4 but only used in v3 — leave it in place as scaffolding.)

**Test (script):**
Direct executeTool calls for each of the 3. The `share_entity` test posts a share to a fake recipient, asserts Activity_Log gains a row.

**Verify (browser):**
Type "send a quote follow-up to gabor@arqgoded.mx for project Residencial San Antonio". Agent should propose first with full body. Reply "yes" → email sends via Gmail. Verify in Sent folder + Email_Activity.

**Commit:** `feat(chat): add share_entity + send_email + reply_to_thread (customer-facing tier — text confirm pattern)`

---

## Task 8 — Final smoke + design doc execution log + commit

**Action:**
- Run `scripts/_test-chat-tools.ts` end-to-end (all 8 new tools)
- `npx tsc --noEmit` clean
- Browser eval: send 5 representative prompts spanning all 4 tiers, confirm tool-call chips render correctly, persistence works, page-context flows
- `npm run build` — verify Netlify will pass (post-Suspense-fix world)
- Append §8 "Execution log" to design doc

**Commit:** `docs(chat): execution log + final smoke results`

---

## Summary

8 tasks → 7 commits. Estimated execution time: 90-120 min.

| # | Task | Commit |
|---|---|---|
| 1 | Extract tools to lib (refactor) | `refactor(chat): extract tool defs + executor to app/lib/chat-tools.ts` |
| 2 | SSE streaming + prompt caching | `feat(chat): stream responses via SSE + Anthropic prompt caching` |
| 3 | Per-page context store | `feat(chat): per-page context store` |
| 4 | UX overhaul | `feat(chat): widget UX v2 — 3 starters, tool chips, persistence, confirm modal, new system prompt` |
| 5 | read + log tools | `feat(chat): add read_inbox + add_note tools` |
| 6 | crm-update tools | `feat(chat): add update_lead_status + update_deal_stage + start_new_trafico` |
| 7 | customer-facing tools | `feat(chat): add share_entity + send_email + reply_to_thread (text confirm)` |
| 8 | Final | `docs(chat): execution log + final smoke results` |

## Risk callouts

- **SSE in Next.js 16 route handlers** — has to use `Response` with a `ReadableStream` body and `text/event-stream` content-type. Should work but worth verifying early.
- **Browser EventSource doesn't support POST** — we use `fetch().body.getReader()` instead. Parse SSE frames manually (small ~30-line helper).
- **Anthropic prompt-cache cache_control type** — `ephemeral` is the only public option as of SDK 0.80.
- **Pause/resume for confirmation tier deferred to v3** — v2 uses ask-first text pattern. Less rich UX but architecturally simple. The `<ChatConfirmModal />` ships in Task 4 as scaffolding for v3 use.
- **Identity name in `add_note` author** — set to `"portal-assistant"` for v2; threading the user's `IDENTITY_KEY` localStorage value into the tool call is a polish for v3.
