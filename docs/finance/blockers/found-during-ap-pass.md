# Bugs found during AP pass (2026-05-12)

No blocking bugs found during this pass.

## Minor observations (non-blocking)

- `POBlocksSendBanner` in `purchases/[id]/page.tsx:145-157` has its own copy of the `APQueueRow` interface, duplicated from the shared module. Could be DRYed in a future pass by importing from `ap-queue-section.tsx`.
- `command-palette.tsx` did not import `Wallet` — added in Task 5.1. No other icons were missing.
- The visibility heuristic uses a client-side hash (`hashFn`) that differs from the server-side SHA-1 (`hashFilename`). The server hash is used for sheet keys; the client hash is used for local state mapping against the server-returned `filename_hash` keys. This works because the client fetches overrides keyed by server hash. No mismatch.
