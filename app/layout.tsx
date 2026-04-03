import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEMORY // Stay Locked In",
  description: "Your personal memory system. Capture everything. Forget nothing. Level up.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
