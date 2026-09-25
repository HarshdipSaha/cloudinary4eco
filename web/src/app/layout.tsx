import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "SAAKSHYA", description: "Every site gets a chart. Every claim needs a witness." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
