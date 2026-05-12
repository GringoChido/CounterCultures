baseline_ts_errors: 0

## §1.3 Summary

## §3 Answers (2026-05-12)

1. **(a) single-page hub** — three stacked sections: Queue, Open vendor bills, Vendor terms
2. **(c) one-line link** — replace embedded APQueueSection in Payments with a "→ View AP queue on Accounts Payable" banner
3. **Order: i→ii→iii→iv** — vendor bill → PO → SO → Inbox. Note: i–iii are covered by the shared AttachmentsPanel in a single edit (Task 5.5). iv (Inbox/AttachmentGrid) is Task 5.7. v (Shipments) is out of scope per §7.
4. **Confirmed** — combined OR heuristic (filename regex + fileSize < 50KB for images + pixel area < 250k) with per-file user overrides persisted to `Attachment_Visibility` sheet tab.
5. **Confirmed** — Drive iframe primary → `<object>` fallback → "Open in Drive" button. No pdfjs-dist.

Task 5.1 commit: f38c0f4

## §1.3 Summary

The codebase has a complete feature-gating system in `features.ts` with `FEATURES` catalog (32 keys), `FINANCE_FEATURES` and `SALES_FEATURES` arrays, and `ROLE_DEFAULTS` mapping roles to feature arrays. There is no `view_ap` key — only `view_ar`. The sidebar (`sidebar.tsx`) has `navItems` (daily-driver) and `moreNavItems` (hidden behind "More"). AR sits at line 62, P&L at line 63 — AP belongs between them. Command palette (`command-palette.tsx`) has `pageItems` array with no AP entry; `Wallet` is NOT imported there. The AP queue API (`ap-queue/route.ts`) works correctly, combining PO data with vendor terms to produce `APQueueRow[]`. The `APQueueSection` component is embedded at `payments/page.tsx:325-411` and uses a local `fmt` helper defined at line 63. `POBlocksSendBanner` in `purchases/[id]/page.tsx:159-192` has its own copy of the `APQueueRow` interface — DO NOT TOUCH. `AttachmentsPanel` is a list-only component with "Open in Drive" and "Download" per row, no preview. `AttachmentGrid` (Gmail) has a single-image lightbox with no prev/next navigation. The AR page uses `Landmark` icon, `useFeatures()` gating, bilingual labels, and section-based layout — this is the pattern to mirror.
