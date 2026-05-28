"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitContact, type ContactState } from "@/app/actions/contact";

const INITIAL: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, INITIAL);
  const mountedAt = useRef<number>(0);
  const elapsedInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (state.status === "ok") {
      formRef.current?.reset();
    }
  }, [state.status]);

  const handleSubmit = () => {
    // Set the hidden input's value synchronously *before* the form action reads FormData.
    // Using React state here would race: setState is async and the FormData snapshot
    // would still contain the previous (initial) value.
    if (elapsedInputRef.current) {
      elapsedInputRef.current.value = String(
        Math.round(performance.now() - mountedAt.current),
      );
    }
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      noValidate
    >
      <label className="block">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Nom
        </span>
        <input
          name="name"
          required
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none"
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-[12px] text-accent">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </label>

      <label className="block">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-[12px] text-accent">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </label>

      <label className="block md:col-span-2">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Sujet (optionnel)
        </span>
        <input
          name="subject"
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none"
        />
      </label>

      <label className="block md:col-span-2">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={6}
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none resize-none"
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-[12px] text-accent">
            {state.fieldErrors.message[0]}
          </p>
        )}
      </label>

      {/* Honeypot — visually hidden but reachable by bots */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Website
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>

      <input
        ref={elapsedInputRef}
        type="hidden"
        name="elapsed_ms"
        defaultValue={0}
      />

      <div className="md:col-span-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3 text-[14px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Envoyer"}
        </button>
        {state.status === "ok" && (
          <span className="text-[13px] text-sage">Message envoyé. Merci.</span>
        )}
        {state.status === "error" && state.error && (
          <span className="text-[13px] text-accent">{state.error}</span>
        )}
      </div>
    </form>
  );
}
