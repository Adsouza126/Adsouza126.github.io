import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rally — Find your next pickup game",
  description:
    "Rally is sports matchmaking for college students. Find skill-based pickup games, reliable players, and campus sports communities.",
};

export const viewport: Viewport = {
  themeColor: "#1A3154",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-sans)" }}>{children}</body>
    </html>
  );
}
