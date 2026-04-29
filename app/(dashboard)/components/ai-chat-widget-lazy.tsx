"use client";

import dynamic from "next/dynamic";

const AIChatWidget = dynamic(
  () => import("./ai-chat-widget").then((m) => m.AIChatWidget),
  { ssr: false }
);

const AIChatWidgetLazy = ({ hideOwnFab = false }: { hideOwnFab?: boolean } = {}) => (
  <AIChatWidget hideOwnFab={hideOwnFab} />
);

export { AIChatWidgetLazy };
