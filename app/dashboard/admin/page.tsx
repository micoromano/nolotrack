import Link from "next/link";
import { Users, Shield, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Amministrazione</h1>
          <p className="text-xs text-on-surface-variant">Gestione utenti e permessi</p>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
          <Link
            href="/dashboard/admin/utenti"
            className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300 flex flex-col gap-6"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-400/5 rounded-full blur-3xl group-hover:bg-slate-400/10 transition-colors" />
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-400/15 text-slate-400">
                <Users size={18} weight="fill" />
              </div>
              <ArrowRight
                size={16}
                weight="bold"
                className="text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Autisti</p>
              <p className="text-xs text-on-surface-variant mt-1">Invita e gestisci gli autisti</p>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/ruoli"
            className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300 flex flex-col gap-6"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
                <Shield size={18} weight="fill" />
              </div>
              <ArrowRight
                size={16}
                weight="bold"
                className="text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ruoli e permessi</p>
              <p className="text-xs text-on-surface-variant mt-1">Configura accessi per sezione</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
