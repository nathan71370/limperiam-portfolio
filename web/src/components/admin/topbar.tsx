import { logoutAction } from "@/app/actions/auth";
import { GhostButton } from "./ghost-button";

type Props = {
  title: string;
  actions?: React.ReactNode;
};

export function Topbar({ title, actions }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-cream px-6 md:px-10 py-6 sticky top-0 z-10">
      <h1 className="font-serif text-ink text-[24px] md:text-[28px] leading-none">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {actions}
        <form action={logoutAction}>
          <GhostButton type="submit">Déconnexion</GhostButton>
        </form>
      </div>
    </header>
  );
}
