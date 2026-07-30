import Link from "next/link";
import { Users, Shield } from "@phosphor-icons/react/dist/ssr";

export default function AdminPage() {
  return (
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Amministrazione</h1>
          <p className="text-xs text-on-surface-variant">Gestione utenti e permessi</p>
        </div>
      </header>
      <div className="px-4 md:px-10 py-8 grid gap-4 sm:grid-cols-2 max-w-xl">
        <Link
          href="/dashboard/admin/utenti"
          className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-primary/50 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-400/15 text-slate-400 flex items-center justify-center">
            <Users size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Autisti</p>
            <p className="text-xs text-on-surface-variant">Invita e gestisci gli autisti</p>
          </div>
        </Link>
        <Link
          href="/dashboard/admin/ruoli"
          className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-primary/50 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Shield size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ruoli e permessi</p>
            <p className="text-xs text-on-surface-variant">Configura accessi per sezione</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
