import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getLang, getTheme } from "@/lib/prefs";
import { LangThemeProvider } from "@/components/lang-theme-provider";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();
  const theme = await getTheme();
  return (
    <html lang={lang} data-theme={theme} className={inter.variable}>
      <body>
        <LangThemeProvider initialLang={lang} initialTheme={theme}>
          {children}
        </LangThemeProvider>
      </body>
    </html>
  );
}
