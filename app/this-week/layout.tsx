import type { ReactNode } from "react";
import type { Metadata } from "next";

import "../globals.css";

export const metadata: Metadata = {
  title: "This week · Counter Cultures",
  description: "Weekly status — what shipped, what's next, what we need from you.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

const ThisWeekLayout = ({ children }: { children: ReactNode }) => {
  return children;
};

export default ThisWeekLayout;
