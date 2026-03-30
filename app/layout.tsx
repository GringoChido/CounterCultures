import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html
      lang="en"
      className={`${cormorantGaramond.variable} ${dmSans.variable} ${jetBrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
