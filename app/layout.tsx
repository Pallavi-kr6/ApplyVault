import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeTracker AI",
  description: "Automatically track and analyze job applications."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
