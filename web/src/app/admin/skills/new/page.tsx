"use client";

import { useActionState } from "react";
import { Topbar } from "@/components/admin/topbar";
import {
  Field,
  FieldSelect,
  FieldCheckbox,
} from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  createSkillAction,
  type SkillFormState,
} from "@/app/actions/skills";

const INITIAL: SkillFormState = { status: "idle" };

const CATEGORIES = [
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "devops", label: "DevOps" },
  { value: "tools", label: "Outils" },
  { value: "soft", label: "Pratique" },
];

export default function NewSkillPage() {
  const [state, action, pending] = useActionState(createSkillAction, INITIAL);

  return (
    <>
      <Topbar title="Nouveau skill" />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <form action={action} className="space-y-6">
          <Field
            label="Nom"
            name="name"
            required
            error={state.fieldErrors?.name?.[0]}
          />
          <FieldSelect
            label="Catégorie"
            name="category"
            options={CATEGORIES}
            required
            error={state.fieldErrors?.category?.[0]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Niveau (1-5)"
              name="level"
              type="number"
              inputMode="numeric"
              hint="Optionnel"
              error={state.fieldErrors?.level?.[0]}
            />
            <Field
              label="Icône"
              name="icon"
              hint="Nom Lucide ou URL (optionnel)"
              error={state.fieldErrors?.icon?.[0]}
            />
          </div>
          <Field
            label="Ordre d'affichage"
            name="display_order"
            type="number"
            defaultValue={0}
            inputMode="numeric"
          />
          <FieldCheckbox
            label="Mis en avant"
            name="is_featured"
            hint="Affiché en priorité sur la home"
          />

          {state.status === "error" && state.error && (
            <p className="text-[13px] text-accent">{state.error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </PrimaryButton>
            <a href="/admin/skills">
              <GhostButton type="button">Annuler</GhostButton>
            </a>
          </div>
        </form>
      </main>
    </>
  );
}
