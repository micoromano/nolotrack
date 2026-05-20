import React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChartLineUp, CurrencyEur, CreditCard, Car, Clock, MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const oggi = new Date().toISOString().split("T")[0];
  const meseInizio = oggi.slice(0, 7) + "-01";

  const [
    { data: autista },
    { data: turnoOggi },
    { data: corseOggi },
    { data: corseMese },
  ] = await Promise.all([
    supabase.from("autisti").select("nome").eq("id", user!.id).maybeSingle(),
    supabase.from("turni").select("*").eq("autista_id", user!.id).eq("data", oggi).maybeSingle(),
    supabase.from("corse").select("*").eq("autista_id", user!.id).eq("data", oggi),
    supabase.from("corse").select("importo").eq("autista_id", user!.id).gte("data", meseInizio).lte("data", oggi),
  ]);

  const totMese = corseMese?.reduce((s, c) => s + (c.importo ?? 0), 0) ?? 0;
  const nomeUtente = autista?.nome?.split(" ")[0] ?? "Marco";

  const dataOggi = new Date().toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const avatarColors = [
    "bg-blue-500/20 text-blue-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-amber-500/20 text-amber-400",
    "bg-rose-500/20 text-rose-400",
    "bg-violet-500/20 text-violet-400",
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border px-6 py-4 sticky top-0 z-10 bg-background">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">Overview</p>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Cerca..."
                className="bg-card border border-border rounded-lg px-3 py-2 text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-40"
              />
              <MagnifyingGlass size={14} className="absolute right-2.5 top-2.5 text-muted-foreground" />
            </div>
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
              MR
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <div className="border-b border-border pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground capitalize mb-1">{dataOggi}</p>
              <h1 className="font-heading text-3xl font-semibold mb-3">
                Bentornato, {nomeUtente}.
              </h1>
              <p className="text-sm text-muted-foreground">
                {turnoOggi
                  ? `Turno: ${turnoOggi.ora_inizio.slice(0, 5)} - ${turnoOggi.ora_fine.slice(0, 5)}`
                  : "Nessun turno in corso"}
              </p>
            </div>
            <Link
              href="/dashboard/corse/nuova"
              className={cn(buttonVariants({ size: "default" }), "gap-1.5 shrink-0")}
            >
              <span>+</span>
              Registra corsa
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricTile
            label="Incassi mensili"
            value={formatEuro(totMese)}
            icon={ChartLineUp}
            iconClass="bg-primary/15 text-primary"
          />
          <MetricTile
            label="Corse oggi"
            value={(corseOggi?.length ?? 0) + " completate"}
            icon={Car}
            iconClass="bg-emerald-400/15 text-emerald-400"
          />
          <MetricTile
            label="Turno di oggi"
            value={
              turnoOggi
                ? `${turnoOggi.ora_inizio.slice(0, 5)}-${turnoOggi.ora_fine.slice(0, 5)}`
                : "Nessun turno"
            }
            icon={Clock}
            iconClass="bg-sky-400/15 text-sky-400"
          />
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  LIVE
                </span>
                <h2 className="text-sm font-semibold text-foreground">Corse recenti</h2>
              </div>
              <Link
                href="/dashboard/corse"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Vedi tutto →
              </Link>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {!corseOggi?.length ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">Nessuna corsa registrata oggi.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {corseOggi.map((c, idx) => (
                    <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {c.ora_partenza.slice(0, 5)}
                        </span>
                        <PagamentoBadge tipo={c.tipo_pagamento} />
                        <span className="text-sm text-foreground truncate">
                          {c.origine} → {c.destinazione}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-success shrink-0">
                        {formatEuro(c.importo)}
                      </span>
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          avatarColors[idx % avatarColors.length]
                        )}
                      >
                        {(c.destinazione || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full font-semibold shrink-0">
                        COMPLETATO
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Fleet Performance</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Mantieni alta la qualità del servizio per massimizzare le valutazioni.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs px-2 py-1 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Veicolo attivo
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, iconClass }: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", iconClass)}>
        <Icon size={18} weight="fill" />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <p className="font-mono text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

const pagamentoBadgeConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  cash:   { label: "Cash",   style: "bg-amber-400/10 text-amber-400",   icon: CurrencyEur },
  carta:  { label: "Carta",  style: "bg-blue-400/10 text-blue-400",     icon: CreditCard },
  uber:   { label: "Uber",   style: "bg-slate-400/10 text-slate-400",   icon: Car },
  noninc: { label: "No Inc", style: "bg-purple-400/10 text-purple-400", icon: CurrencyEur },
};

function PagamentoBadge({ tipo }: { tipo: string }) {
  const cfg = pagamentoBadgeConfig[tipo] ?? pagamentoBadgeConfig.uber;
  const { icon: Icon } = cfg;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0", cfg.style)}>
      <Icon size={10} weight="fill" />
      {cfg.label}
    </span>
  );
}
