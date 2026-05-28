"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { Field, FieldTextarea } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  createExperienceAction,
  type ExperienceFormState,
} from "@/app/actions/experiences";

const INITIAL: ExperienceFormState = { status: "idle" };

export default function NewExperiencePage() {
  const [state, action, pending] = useActionState(
    createExperienceAction,
    INITIAL,
  );

  return (
    <>
      <Topbar title="Nouvelle expérience" />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <form action={action} className="space-y-6">
          <Field
            label="Entreprise"
            name="company"
            required
            error={state.fieldErrors?.company?.[0]}
          />

          <div className="rounded-2xl border border-line bg-stage-2 p-6 space-y-4">
            <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute">
              🇫🇷 Français
            </p>
            <Field
              label="Rôle"
              name="role"
              required
              error={state.fieldErrors?.role?.[0]}
            />
            <FieldTextarea
              label="Description"
              name="description"
              rows={5}
              error={state.fieldErrors?.description?.[0]}
            />
            <Field
              label="Localisation"
              name="location"
              error={state.fieldErrors?.location?.[0]}
            />
          </div>

          <div className="rounded-2xl border border-line bg-stage-2 p-6 space-y-4">
            <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute">
              🇬🇧 English
            </p>
            <Field
              label="Role"
              name="role_en"
              hint="Optionnel — version anglaise"
              error={state.fieldErrors?.role_en?.[0]}
            />
            <FieldTextarea
              label="Description"
              name="description_en"
              rows={5}
              error={state.fieldErrors?.description_en?.[0]}
            />
            <Field
              label="Location"
              name="location_en"
              error={state.fieldErrors?.location_en?.[0]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Date de début"
              name="start_date"
              type="date"
              required
              error={state.fieldErrors?.start_date?.[0]}
            />
            <Field
              label="Date de fin"
              name="end_date"
              type="date"
              hint="Laisser vide si en cours"
              error={state.fieldErrors?.end_date?.[0]}
            />
          </div>
          <Field
            label="Ordre d'affichage"
            name="display_order"
            type="number"
            defaultValue={0}
            inputMode="numeric"
          />

          {state.status === "error" && state.error && (
            <p className="text-[13px] text-accent">{state.error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </PrimaryButton>
            <Link href="/admin/experiences">
              <GhostButton type="button">Annuler</GhostButton>
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
