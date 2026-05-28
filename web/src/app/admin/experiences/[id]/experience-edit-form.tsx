"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FieldTextarea } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  updateExperienceAction,
  type ExperienceFormState,
} from "@/app/actions/experiences";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

const INITIAL: ExperienceFormState = { status: "idle" };

function toDateInput(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  // API returns ISO date "YYYY-MM-DD" already
  return value.slice(0, 10);
}

export function ExperienceEditForm({ experience }: { experience: Experience }) {
  const action = updateExperienceAction.bind(null, experience.id);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Entreprise"
        name="company"
        required
        defaultValue={experience.company}
        error={state.fieldErrors?.company?.[0]}
      />
      <Field
        label="Rôle"
        name="role"
        required
        defaultValue={experience.role}
        error={state.fieldErrors?.role?.[0]}
      />
      <FieldTextarea
        label="Description"
        name="description"
        rows={5}
        defaultValue={experience.description}
        error={state.fieldErrors?.description?.[0]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Date de début"
          name="start_date"
          type="date"
          required
          defaultValue={toDateInput(experience.start_date)}
          error={state.fieldErrors?.start_date?.[0]}
        />
        <Field
          label="Date de fin"
          name="end_date"
          type="date"
          defaultValue={toDateInput(experience.end_date)}
          hint="Laisser vide si en cours"
          error={state.fieldErrors?.end_date?.[0]}
        />
      </div>
      <Field
        label="Localisation"
        name="location"
        defaultValue={experience.location}
        error={state.fieldErrors?.location?.[0]}
      />
      <Field
        label="Ordre d'affichage"
        name="display_order"
        type="number"
        defaultValue={experience.display_order}
        inputMode="numeric"
      />

      {state.status === "error" && state.error && (
        <p className="text-[13px] text-accent">{state.error}</p>
      )}
      {state.status === "ok" && (
        <p className="text-[13px] text-sage">Modifications enregistrées.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Sauvegarde…" : "Enregistrer"}
        </PrimaryButton>
        <Link href="/admin/experiences">
          <GhostButton type="button">Retour</GhostButton>
        </Link>
      </div>
    </form>
  );
}
