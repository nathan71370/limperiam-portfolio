"use client";

import { useActionState } from "react";
import {
  Field,
  FieldSelect,
  FieldCheckbox,
} from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  updateSkillAction,
  type SkillFormState,
} from "@/app/actions/skills";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

const INITIAL: SkillFormState = { status: "idle" };

const CATEGORIES = [
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "devops", label: "DevOps" },
  { value: "tools", label: "Outils" },
  { value: "soft", label: "Pratique" },
];

export function SkillEditForm({ skill }: { skill: Skill }) {
  const action = updateSkillAction.bind(null, skill.id);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Nom"
        name="name"
        required
        defaultValue={skill.name}
        error={state.fieldErrors?.name?.[0]}
      />
      <FieldSelect
        label="Catégorie"
        name="category"
        options={CATEGORIES}
        required
        defaultValue={skill.category}
        error={state.fieldErrors?.category?.[0]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Niveau (1-5)"
          name="level"
          type="number"
          inputMode="numeric"
          defaultValue={skill.level}
          hint="Optionnel"
          error={state.fieldErrors?.level?.[0]}
        />
        <Field
          label="Icône"
          name="icon"
          defaultValue={skill.icon}
          hint="Nom Lucide ou URL"
          error={state.fieldErrors?.icon?.[0]}
        />
      </div>
      <Field
        label="Ordre d'affichage"
        name="display_order"
        type="number"
        defaultValue={skill.display_order}
        inputMode="numeric"
      />
      <FieldCheckbox
        label="Mis en avant"
        name="is_featured"
        defaultChecked={skill.is_featured}
        hint="Affiché en priorité sur la home"
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
        <a href="/admin/skills">
          <GhostButton type="button">Retour</GhostButton>
        </a>
      </div>
    </form>
  );
}
