import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import {
  deleteMessageAction,
  toggleReadAction,
} from "@/app/actions/messages";
import type { components } from "@/lib/api-types";

type Message = components["schemas"]["ContactMessageOut"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function MessagesPage() {
  const messages = await apiAdminGet<Message[]>("/admin/messages");

  return (
    <>
      <Topbar title="Messages reçus" />
      <main className="flex-1 px-6 md:px-10 py-10">
        {messages.length === 0 ? (
          <div className="rounded-2xl bg-card border border-line p-12 text-center text-[14px] text-ink-mute">
            Aucun message.
          </div>
        ) : (
          <ul className="flex flex-col gap-3 max-w-3xl">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  "rounded-2xl bg-card border p-6 shadow-card " +
                  (m.is_read ? "border-line" : "border-accent/30")
                }
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink text-[15px]">{m.name}</p>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-[13px] text-ink-soft hover:text-accent"
                    >
                      {m.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[1.5px] text-ink-mute">
                    {!m.is_read && (
                      <span className="rounded-full bg-accent/15 text-accent px-2 py-0.5">
                        Non lu
                      </span>
                    )}
                    <time>{formatDate(m.created_at)}</time>
                  </div>
                </header>
                {m.subject && (
                  <p className="mt-3 text-[14px] font-medium text-ink">
                    {m.subject}
                  </p>
                )}
                <p className="mt-2 text-[14px] text-ink-soft whitespace-pre-wrap leading-[1.6]">
                  {m.message}
                </p>
                <footer className="mt-4 flex items-center gap-4">
                  <form action={toggleReadAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      type="hidden"
                      name="is_read"
                      value={String(m.is_read)}
                    />
                    <button
                      type="submit"
                      className="text-[12px] text-ink-soft hover:text-ink underline-offset-4 hover:underline"
                    >
                      {m.is_read ? "Marquer non lu" : "Marquer lu"}
                    </button>
                  </form>
                  <form action={deleteMessageAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="text-[12px] text-ink-mute hover:text-accent underline-offset-4 hover:underline"
                    >
                      Supprimer
                    </button>
                  </form>
                </footer>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
