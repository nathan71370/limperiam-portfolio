"use client";

import { useActionState } from "react";
import { Field, FieldTextarea, FieldCheckbox } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  updateProjectAction,
  type ProjectFormState,
} from "@/app/actions/projects";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

const INITIAL: ProjectFormState = { status: "idle" };

export function ProjectEditForm({ project }: { project: Project }) {
  const action = updateProjectAction.bind(null, project.id);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const tech = Array.isArray(project.tech_stack) ? project.tech_stack : [];

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Slug"
        name="slug"
        required
        defaultValue={project.slug}
        pattern="[a-z0-9-]+"
        error={state.fieldErrors?.slug?.[0]}
      />
      <Field
        label="Titre"
        name="title"
        required
        defaultValue={project.title}
        error={state.fieldErrors?.title?.[0]}
      />
      <FieldTextarea
        label="Description courte"
        name="description"
        required
        rows={3}
        defaultValue={project.description}
        error={state.fieldErrors?.description?.[0]}
      />
      <FieldTextarea
        label="Contenu (markdown)"
        name="content"
        rows={10}
        defaultValue={project.content}
        error={state.fieldErrors?.content?.[0]}
      />
      <Field
        label="Tech stack (séparés par virgules)"
        name="tech_stack"
        defaultValue={tech.join(", ")}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="URL du site"
          name="live_url"
          type="url"
          defaultValue={project.live_url}
          error={state.fieldErrors?.live_url?.[0]}
        />
        <Field
          label="URL du repo"
          name="repo_url"
          type="url"
          defaultValue={project.repo_url}
          error={state.fieldErrors?.repo_url?.[0]}
        />
      </div>
      <Field
        label="Ordre d'affichage"
        name="display_order"
        type="number"
        defaultValue={project.display_order}
        inputMode="numeric"
      />
      <FieldCheckbox
        label="Publié"
        name="is_published"
        defaultChecked={project.is_published}
        hint="Décoche pour garder en brouillon"
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
        <a href="/admin/projects">
          <GhostButton type="button">Retour</GhostButton>
        </a>
      </div>
    </form>
  );
}
