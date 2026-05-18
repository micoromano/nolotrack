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
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <Link href="/dashboard/admin" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Admin
        </Link>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Ruoli e permessi</h1>
      </div>
      <div className="p-6 space-y-6">
        {ruoli.map((ruolo) => (
          <div key={ruolo.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold capitalize">{ruolo.nome}</p>
              {ruolo.descrizione && (
                <p className="text-xs text-muted-foreground">{ruolo.descrizione}</p>
              )}
            </div>
            <div className="divide-y divide-border">
              <div className="grid grid-cols-4 px-4 py-1.5 bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sezione</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Visualizza</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Modifica</span>
                <span />
              </div>
              {SEZIONI.map((sezione) => {
                const p = mappa[ruolo.id]?.[sezione];
                return (
                  <div key={sezione} className="grid grid-cols-4 px-4 py-2 items-center">
                    <span className="text-sm capitalize">{sezione}</span>
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
          <p className="text-sm text-muted-foreground text-center py-8">
            Nessun ruolo trovato. Esegui la migrazione SQL nel Supabase dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
