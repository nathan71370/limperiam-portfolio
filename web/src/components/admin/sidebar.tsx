const ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Projets", href: "/admin/projects" },
  { label: "Expériences", href: "/admin/experiences" },
  { label: "Skills", href: "/admin/skills" },
  { label: "Messages", href: "/admin/messages" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-line bg-stage-2 px-6 py-8 sticky top-0 h-screen">
      <a
        href="/admin"
        className="font-serif italic text-[22px] leading-none text-ink"
      >
        limperiam
      </a>
      <p className="mt-1 text-[11px] uppercase tracking-[1.5px] text-ink-mute">
        Admin
      </p>
      <nav className="mt-8 flex flex-col gap-1">
        {ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-[14px] text-ink-soft hover:bg-cream hover:text-ink transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="mt-auto pt-8">
        <a
          href="/"
          className="text-[12px] text-ink-mute hover:text-ink underline-offset-4 hover:underline"
        >
          ← Retour au site
        </a>
      </div>
    </aside>
  );
}
