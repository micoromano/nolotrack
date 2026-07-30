import Link from "next/link";
import { Users, Shield } from "@phosphor-icons/react/dist/ssr";

export default function AdminPage() {
  return (
    <div>
      <div className="border-b border-border px-6 py-3 bg-card">
        <h1 className="text-sm font-semibold">Amministrazione</h1>
        <p className="text-xs text-muted-foreground">Gestione utenti e permessi</p>
      </div>
      <div className="p-6 grid gap-4 sm:grid-cols-2 max-w-xl">
        <Link
          href="/dashboard/admin/utenti"
          className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-400/15 text-slate-400 flex items-center justify-center">
            <Users size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold">Autisti</p>
            <p className="text-xs text-muted-foreground">Invita e gestisci gli autisti</p>
          </div>
        </Link>
        <Link
          href="/dashboard/admin/ruoli"
          className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Shield size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ruoli e permessi</p>
            <p className="text-xs text-muted-foreground">Configura accessi per sezione</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
