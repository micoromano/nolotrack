import React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChartLineUp, CurrencyEur, CreditCard, Car, Clock, Plus,
  TrendUp, ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const oggi = new Date().toISOString().split("T")[0];
  const meseInizio = oggi.slice(0, 7) + "-01";
  const mesePrecedente = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString().split("T")[0];
  const mesePrecedenteFine = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    .toISOString().split("T")[0];

  const [
    { data: autista },
    { data: turnoOggi },
    { data: corseOggi },
    { data: corseMese },
    { data: corseMesePrecedente },
  ] = await Promise.all([
    supabase.from("autisti").select("nome").eq("id", user!.id).maybeSingle(),
    supabase.from("turni").select("*").eq("autista_id", user!.id).eq("data", oggi).maybeSingle(),
    supabase.from("corse").select("*").eq("autista_id", user!.id).eq("data", oggi),
    supabase.from("corse").select("importo").eq("autista_id", user!.id).gte("data", meseInizio).lte("data", oggi),
    supabase.from("corse").select("importo").eq("autista_id", user!.id).gte("data", mesePrecedente).lte("data", mesePrecedenteFine),
  ]);

  const totMese = corseMese?.reduce((s, c) => s + (c.importo ?? 0), 0) ?? 0;
  const totMesePrecedente = corseMesePrecedente?.reduce((s, c) => s + (c.importo ?? 0), 0) ?? 0;
  const deltaMese = totMesePrecedente > 0
    ? ((totMese - totMesePrecedente) / totMesePrecedente * 100).toFixed(1)
    : null;

  const nomeUtente = autista?.nome?.split(" ")[0] ?? "Marco";

  const dataOggi = new Date().toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="min-h-screen">
      {/* Sticky glassmorphic header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <h2 className="font-heading text-lg font-bold text-primary">Overview</h2>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Cerca corse..."
              className="bg-surface-container-lowest border border-border-subtle rounded-full px-4 py-1.5 text-sm text-foreground placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 w-48 transition-all"
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
            {nomeUtente.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-10">
        {/* Welcome section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
              {turnoOggi ? "Status: In Servizio" : "Status: Fuori Servizio"} — {dataOggi}
            </p>
            <h1 className="font-heading text-3xl md:text-5xl font-black text-foreground tracking-tight mb-2">
              Bentornato, {nomeUtente}.
            </h1>
            <p className="text-sm text-on-surface-variant max-w-xl">
              {turnoOggi
                ? `Turno attivo: ${turnoOggi.ora_inizio.slice(0, 5)} – ${turnoOggi.ora_fine.slice(0, 5)} · ${corseOggi?.length ?? 0} corse registrate`
                : "Nessun turno attivo. Registra il tuo turno per iniziare."}
            </p>
          </div>
          <Link
            href="/dashboard/corse/nuova"
            className={cn(
              buttonVariants({ size: "default" }),
              "gap-2 shrink-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold uppercase tracking-wide text-xs"
            )}
          >
            <Plus size={16} weight="bold" />
            Registra Corsa
          </Link>
        </section>

        {/* Bento metrics grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly revenue */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <ChartLineUp size={20} weight="fill" className="text-primary" />
              </div>
              {deltaMese !== null && (
                <span className={cn(
                  "flex items-center gap-1 font-mono text-xs font-bold",
                  parseFloat(deltaMese) >= 0 ? "text-success-emerald" : "text-destructive"
                )}>
                  <TrendUp size={12} weight="bold" />
                  {parseFloat(deltaMese) >= 0 ? "+" : ""}{deltaMese}% vs mese scorso
                </span>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Incassi Mensili</p>
            <p className="font-mono text-3xl font-bold text-foreground tracking-tighter">{formatEuro(totMese)}</p>
          </div>

          {/* Today rides */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-tertiary/10 rounded-xl">
                <Car size={20} weight="fill" className="text-tertiary" />
              </div>
              <span className="font-mono text-xs text-on-surface-variant">Oggi</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Corse Oggi</p>
            <div className="flex items-baseline gap-2">
              <p className="font-mono text-3xl font-bold text-foreground tracking-tighter">{corseOggi?.length ?? 0}</p>
              <span className="text-sm text-on-surface-variant">completate</span>
            </div>
          </div>

          {/* Shift */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-sky-400/10 rounded-xl">
                <Clock size={20} weight="fill" className="text-sky-400" />
              </div>
              {turnoOggi && (
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Attivo
                </span>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Turno di Oggi</p>
            {turnoOggi ? (
              <>
                <p className="font-mono text-xl font-bold text-foreground">
                  {turnoOggi.ora_inizio.slice(0, 5)} – {turnoOggi.ora_fine.slice(0, 5)}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {Number(turnoOggi.ore_lavorate).toFixed(1)} ore lavorate
                </p>
              </>
            ) : (
              <p className="font-mono text-xl font-bold text-on-surface-variant">Nessun turno</p>
            )}
          </div>
        </section>

        {/* Recent rides table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-lg font-semibold text-foreground">Corse Recenti</h3>
              <span className="bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success-emerald animate-pulse" />
                LIVE
              </span>
            </div>
            <Link href="/dashboard/corse" className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
              Vedi tutto <ArrowRight size={12} weight="bold" />
            </Link>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            {!corseOggi?.length ? (
              <div className="px-6 py-16 text-center">
                <Car size={32} weight="light" className="text-on-surface-variant mx-auto mb-3" />
                <p className="text-sm text-on-surface-variant">Nessuna corsa registrata oggi.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[100px_80px_1fr_1fr_100px_80px] px-6 py-3 border-b border-border-subtle bg-surface-container-low/50">
                  {["Ora", "Tipo", "Partenza", "Destinazione", "Importo", "Stato"].map(h => (
                    <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">{h}</span>
                  ))}
                </div>
                <div className="divide-y divide-border-subtle">
                  {corseOggi.map((c) => (
                    <Link key={c.id} href={`/dashboard/corse/${c.id}`} className="block hover:bg-surface-variant/20 transition-colors cursor-pointer">
                      <div className="hidden sm:grid grid-cols-[100px_80px_1fr_1fr_100px_80px] px-6 py-4 items-center gap-2">
                        <span className="font-mono text-xs text-on-surface-variant">{c.ora_partenza.slice(0, 5)}</span>
                        <PagamentoBadge tipo={c.tipo_pagamento} />
                        <span className="text-sm text-foreground truncate">{c.origine}</span>
                        <span className="text-sm text-on-surface-variant truncate">{c.destinazione}</span>
                        <span className="font-mono text-sm font-bold text-success-emerald">{formatEuro(c.importo)}</span>
                        <span className="px-2 py-0.5 rounded-full bg-success-emerald/10 text-success-emerald text-[10px] font-bold uppercase w-fit">
                          OK
                        </span>
                      </div>
                      <div className="sm:hidden px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-on-surface-variant">{c.ora_partenza.slice(0, 5)}</span>
                            <PagamentoBadge tipo={c.tipo_pagamento} />
                          </div>
                          <p className="text-sm text-foreground truncate">{c.origine} → {c.destinazione}</p>
                        </div>
                        <span className="font-mono text-sm font-bold text-success-emerald shrink-0">{formatEuro(c.importo)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const pagamentoBadgeConfig: Record<string, { label: string; style: string }> = {
  cash:   { label: "Cash",   style: "bg-amber-400/10 text-amber-400 border border-amber-400/20" },
  carta:  { label: "Carta",  style: "bg-blue-400/10 text-blue-400 border border-blue-400/20" },
  uber:   { label: "Uber",   style: "bg-slate-400/10 text-slate-400 border border-slate-400/20" },
  noninc: { label: "No Inc", style: "bg-purple-400/10 text-purple-400 border border-purple-400/20" },
};

function PagamentoBadge({ tipo }: { tipo: string }) {
  const cfg = pagamentoBadgeConfig[tipo] ?? pagamentoBadgeConfig.uber;
  return (
    <span className={cn("inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 w-fit", cfg.style)}>
      {cfg.label}
    </span>
  );
}
