import { Kicker } from "@/components/kicker";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Connexion — admin · limperiam",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md rounded-2xl bg-card border border-line shadow-card p-8">
        <Kicker>ADMIN</Kicker>
        <h1 className="mt-4 font-serif text-ink text-[32px] leading-[1.1]">
          Connexion
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Accès réservé à l&apos;administrateur du portfolio.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
