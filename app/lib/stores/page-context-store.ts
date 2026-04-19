import { create } from "zustand";

/**
 * Per-page context the AI chat widget reads on every send. Pages set
 * the relevant entity when a detail view opens / closes; the widget
 * forwards a one-paragraph addendum to the agent's system prompt so
 * "add a note for this deal" works without restating the ID.
 *
 * Only minimal display fields are stored — never put PII or large
 * blobs here.
 */

export interface SelectedDealCtx {
  id: string;
  name: string;
  company: string;
  stage: string;
}

export interface SelectedLeadCtx {
  id: string;
  name: string;
  status: string;
}

interface PageContextState {
  pathname: string;
  selectedDeal: SelectedDealCtx | null;
  selectedLead: SelectedLeadCtx | null;
  setPathname: (p: string) => void;
  setSelectedDeal: (d: SelectedDealCtx | null) => void;
  setSelectedLead: (l: SelectedLeadCtx | null) => void;
}

export const usePageContextStore = create<PageContextState>((set) => ({
  pathname: "",
  selectedDeal: null,
  selectedLead: null,
  setPathname: (pathname) => set({ pathname }),
  setSelectedDeal: (selectedDeal) => set({ selectedDeal }),
  setSelectedLead: (selectedLead) => set({ selectedLead }),
}));

/**
 * Render the current store state as the inline addendum the agent
 * receives. Returns empty string if there's nothing useful to say.
 */
export const renderPageContext = (s: {
  pathname?: string;
  selectedDeal?: SelectedDealCtx | null;
  selectedLead?: SelectedLeadCtx | null;
}): string => {
  const lines: string[] = [];
  if (s.pathname) lines.push(`- On page: ${s.pathname}`);
  if (s.selectedDeal) {
    const d = s.selectedDeal;
    lines.push(
      `- Currently viewing deal: ${d.id} (${d.name}, ${d.company}, ${d.stage})`
    );
  }
  if (s.selectedLead) {
    const l = s.selectedLead;
    lines.push(`- Currently viewing lead: ${l.id} (${l.name}, ${l.status})`);
  }
  return lines.join("\n");
};
