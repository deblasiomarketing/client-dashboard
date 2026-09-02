import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeBlasio Marketing Dashboard",
  description: "Agency operations + client marketing portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
