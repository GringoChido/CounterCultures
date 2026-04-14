"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/app/components/ui/chat-widget").then((m) => m.ChatWidget),
  { ssr: false }
);

const ChatWidgetLazy = ({ locale }: { locale: string }) => (
  <ChatWidget locale={locale} />
);

export { ChatWidgetLazy };
