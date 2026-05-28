"use client";

import { useActionState } from "react";
import { Topbar } from "@/components/admin/topbar";
import { Field, FieldTextarea, FieldCheckbox } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/app/actions/projects";

const INITIAL: ProjectFormState = { status: "idle" };

export default function NewProjectPage() {
  const [state, action, pending] = useActionState(createProjectAction, INITIAL);

  return (
    <>
      <Topbar title="Nouveau projet" />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <form action={action} className="space-y-6">
          <Field
            label="Slug"
            name="slug"
            required
            hint="URL-friendly, ex: mon-projet"
            pattern="[a-z0-9-]+"
            error={state.fieldErrors?.slug?.[0]}
          />
          <Field
            label="Titre"
            name="title"
            required
            error={state.fieldErrors?.title?.[0]}
          />
          <FieldTextarea
            label="Description courte"
            name="description"
            required
            rows={3}
            hint="Affichée sur la carte projet"
            error={state.fieldErrors?.description?.[0]}
          />
          <FieldTextarea
            label="Contenu (markdown)"
            name="content"
            rows={10}
            hint="Optionnel — page détail si renseigné"
            error={state.fieldErrors?.content?.[0]}
          />
          <Field
            label="Tech stack (séparés par virgules)"
            name="tech_stack"
            hint='ex: "React, Python, Docker"'
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="URL du site"
              name="live_url"
              type="url"
              error={state.fieldErrors?.live_url?.[0]}
            />
            <Field
              label="URL du repo"
              name="repo_url"
              type="url"
              error={state.fieldErrors?.repo_url?.[0]}
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
            label="Publié"
            name="is_published"
            hint="Décoche pour garder en brouillon"
          />

          {state.status === "error" && state.error && (
            <p className="text-[13px] text-accent">{state.error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </PrimaryButton>
            <a href="/admin/projects">
              <GhostButton type="button">Annuler</GhostButton>
            </a>
          </div>
        </form>
      </main>
    </>
  );
}
