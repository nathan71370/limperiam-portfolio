"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const INITIAL: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-[12px] text-accent">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </label>

      <label className="block">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Mot de passe
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none"
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-[12px] text-accent">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </label>

      {state.status === "error" && state.error && (
        <p className="text-[13px] text-accent">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-ink text-cream px-6 py-3 text-[14px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
