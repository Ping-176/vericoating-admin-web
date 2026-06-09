import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vericoating Admin",
  description: "Admin system for Vericoating catalog and sample requests.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
