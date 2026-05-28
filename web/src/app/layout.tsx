import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "limperiam — Nathan Mercier · Fullstack Developer",
  description:
    "Nathan Mercier — freelance fullstack developer (backend-oriented). Java, Spring, Python, SvelteKit, iOS. Lyon.",
  metadataBase: new URL("https://limperiam.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
