import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SEZIONI = ["home", "turni", "corse", "cassa", "spese", "carburante", "stipendio", "report", "invia", "agenda", "admin"];

export default async function AdminRuoliPage() {
  const supabase = await createClient();

  const [ruoliRes, permessiRes] = await Promise.allSettled([
    supabase.from("ruoli").select("id, nome, descrizione").order("nome"),
    supabase.from("ruolo_permessi").select("ruolo_id, sezione, can_view, can_edit"),
  ]);

  const ruoli = ruoliRes.status === "fulfilled" ? ruoliRes.value.data ?? [] : [];
  const permessi = permessiRes.status === "fulfilled" ? permessiRes.value.data ?? [] : [];

  const mappa: Record<string, Record<string, { can_view: boolean; can_edit: boolean }>> = {};
  for (const p of permessi) {
    if (!mappa[p.ruolo_id]) mappa[p.ruolo_id] = {};
    mappa[p.ruolo_id][p.sezione] = { can_view: p.can_view, can_edit: p.can_edit };
  }

  return (
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <Link href="/dashboard/admin" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Admin
        </Link>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Ruoli e permessi</h1>
      </header>
      <div className="px-4 md:px-10 py-8 space-y-6">
        {ruoli.map((ruolo) => (
          <div key={ruolo.id} className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-sm font-semibold capitalize text-foreground">{ruolo.nome}</p>
              {ruolo.descrizione && (
                <p className="text-xs text-on-surface-variant">{ruolo.descrizione}</p>
              )}
            </div>
            <div className="divide-y divide-border-subtle">
              <div className="grid grid-cols-4 px-4 py-1.5 bg-surface-container-low/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">Sezione</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container text-center">Visualizza</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container text-center">Modifica</span>
                <span />
              </div>
              {SEZIONI.map((sezione) => {
                const p = mappa[ruolo.id]?.[sezione];
                return (
                  <div key={sezione} className="grid grid-cols-4 px-4 py-2 items-center">
                    <span className="text-sm capitalize text-foreground">{sezione}</span>
                    <div className="flex justify-center">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        p?.can_view ? "bg-emerald-400/15 text-emerald-400" : "bg-muted/40 text-muted-foreground"
                      )}>
                        {p?.can_view ? "sì" : "no"}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        p?.can_edit ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
                      )}>
                        {p?.can_edit ? "sì" : "no"}
                      </span>
                    </div>
                    <div />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {ruoli.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-8">
            Nessun ruolo trovato. Esegui la migrazione SQL nel Supabase dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
