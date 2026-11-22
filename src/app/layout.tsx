import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FairStep",
  description:
    "FairStep helps small business owners run fair, fully documented disciplinary processes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
