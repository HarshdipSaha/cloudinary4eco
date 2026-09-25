import "./globals.css";
import type { ReactNode } from "react";
import { Atkinson_Hyperlegible, JetBrains_Mono, Source_Serif_4 } from "next/font/google";

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata = {
  title: { default: "SAAKSHYA", template: "%s · SAAKSHYA" },
  description: "Every site gets a chart. Every claim needs a witness.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${atkinson.variable} ${jetbrains.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
