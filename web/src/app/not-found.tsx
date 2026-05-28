import Link from "next/link";
import { TopBar } from "@/components/topbar";
import { Footer } from "@/components/sections/footer";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] py-32 text-center">
        <p className="font-serif text-accent text-[14px] tracking-[2px] uppercase">
          404
        </p>
        <h1
          className="mt-4 font-serif text-ink leading-[1.05]"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Page introuvable.
        </h1>
        <Link
          href="/"
          className="mt-8 inline-block text-[14px] text-accent hover:text-accent-deep underline-offset-4 hover:underline"
        >
          Retour à l&apos;accueil →
        </Link>
      </main>
      <Footer />
    </>
  );
}
