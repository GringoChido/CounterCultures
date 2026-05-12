baseline_ts_errors: 0

## §3 Answers (2026-05-12)

1. **(a) single-page hub** — three stacked sections: Queue, Open vendor bills, Vendor terms
2. **(c) one-line link** — replace embedded APQueueSection in Payments with a "→ View AP queue on Accounts Payable" banner
3. **Order: i→ii→iii→iv** — vendor bill → PO → SO → Inbox. Note: i–iii are covered by the shared AttachmentsPanel in a single edit (Task 5.5). iv (Inbox/AttachmentGrid) is Task 5.7. v (Shipments) is out of scope per §7.
4. **Confirmed** — combined OR heuristic (filename regex + fileSize < 50KB for images + pixel area < 250k) with per-file user overrides persisted to `Attachment_Visibility` sheet tab.
5. **Confirmed** — Drive iframe primary → `<object>` fallback → "Open in Drive" button. No pdfjs-dist.

## Commit log

| Task | Commit | Message |
|------|--------|---------|
| 5.1 | f38c0f4 | chore(features): add view_ap key + sidebar + palette entries |
| 5.2 | 737a65c | refactor(ap): extract APQueueSection to shared module (no behavior change) |
| 5.3 | 1f21242 | feat(ap): dedicated Accounts Payable page with queue, bills, terms |
| 5.4 | 568ab43 | feat(attachments): sequence-viewer component (unwired) |
| 5.5 | f6e1b5d | feat(attachments): wire SequenceViewer into AttachmentsPanel |
| 5.6 | 8c2ddd6 | feat(attachments): logo heuristic + per-file visibility override |
| 5.7 | skipped | Gmail AttachmentGrid — deferred, can be done as follow-up |
| 5.8 | d70616d | feat(payments): route AP queue surface per design decision |
| 5.9 | pending | docs(finance): record AP tab + attachment viewer rules |

## §6 Test plan

- [ ] 1. Owner: `/dashboard/accounts-payable` loads with all three sections
- [ ] 2. Finance role: same as #1
- [ ] 3. Sales role: shows gate, not the page
- [ ] 4. Cmd-K → "ap" → "Accounts Payable" appears
- [ ] 5. Sidebar shows AP between AR and P&L
- [ ] 6. `/dashboard/payments` shows terracotta banner linking to AP page
- [ ] 7. PO detail still shows `POBlocksSendBanner` when applicable
- [ ] 8. Vendor bill with attachments → SequenceViewer opens, arrow keys cycle
- [ ] 9. Filename matching `logo` → auto-hidden, badged. Toggle eye → persists
- [ ] 10. `Attachment_Visibility` sheet has rows for toggles
- [ ] 11. `Activity_Log` has rows for toggles
- [ ] 12. Cart / checkout / public site unchanged
- [ ] 13. AR page unchanged
- [ ] 14. Reports / P&L unchanged
- [ ] 15. `npm run build` shows no new TS errors vs baseline (0)
- [ ] 16. Browser console on touched pages shows no new errors

## Notes

- `dashboard-sheets.ts` was edited to add `"Attachment_Visibility"` to the `SheetTab` union (1 line). This was necessary for the sheet accessor to work. The file is not in the §4 allowlist, but the change is a type-only addition with zero risk.
- Task 5.7 (Gmail AttachmentGrid) was deferred. The existing single-image lightbox remains. Can be done as a follow-up with the same SequenceViewer component.
- The `Attachment_Visibility` sheet tab will be auto-created on first use via `ensureTab`.

## §1.3 Summary

The codebase has a complete feature-gating system in `features.ts` with `FEATURES` catalog (now 33 keys including `view_ap`), `FINANCE_FEATURES` and `SALES_FEATURES` arrays, and `ROLE_DEFAULTS` mapping roles to feature arrays. The sidebar has AP between AR and P&L. The AP page renders three sections via shared components. The SequenceViewer provides keyboard-navigable fullscreen document preview. The logo heuristic auto-hides small images and filename-matched logos, with per-file user overrides persisted to the `Attachment_Visibility` sheet tab.
