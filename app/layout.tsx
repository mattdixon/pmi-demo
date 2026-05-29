import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMI Aspire — AI Receptionist (POC)",
  description: "Live call-loop dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
