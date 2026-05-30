"use client";

import { useRef, useState, useTransition } from "react";
import { uploadProjectImageAction } from "@/app/actions/projects";
import { GhostButton } from "./ghost-button";

export function ImageUpload({ projectId }: { projectId: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    setMessage(null);
    startTransition(async () => {
      const result = await uploadProjectImageAction(projectId, form);
      if (result.status === "ok") {
        setMessage({ kind: "ok", text: "Image mise à jour." });
      } else {
        setMessage({
          kind: "error",
          text: result.error ?? "Échec de l'upload",
        });
      }
      // reset input so the same file can be re-selected
      e.target.value = "";
    });
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute mb-2">
        Remplacer l&apos;image
      </p>
      {/*
        Nesting a <button> inside a <label> captures the click and the file
        picker never opens. Use a button + ref + .click() instead.
      */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onChange}
        disabled={pending}
        className="sr-only"
      />
      <GhostButton
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Upload…" : "Choisir un fichier"}
      </GhostButton>
      <p className="mt-2 text-[11px] text-ink-mute">
        PNG / JPEG / WebP — 2 Mo max
      </p>
      {message && (
        <p
          className={
            "mt-2 text-[12px] " +
            (message.kind === "ok" ? "text-sage" : "text-accent")
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
