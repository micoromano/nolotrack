import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChartLineUp, CurrencyEur, CreditCard, Car, Tag, Clock, ArrowRight, Plus, CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return `${h}h ${m}m`;
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const oggi = new Date().toISOString().split("T")[0];

  const [{ data: autista }, { data: turnoOggi }, { data: corseOggi }] = await Promise.all([
    supabase.from("autisti").select("nome").eq("id", user!.id).maybeSingle(),
    supabase.from("turni").select("*").eq("autista_id", user!.id).eq("data", oggi).maybeSingle(),
    supabase.from("corse").select("*").eq("autista_id", user!.id).eq("data", oggi),
  ]);

  const totCash = corseOggi?.filter((c) => c.tipo_pagamento === "cash").reduce((s, c) => s + c.importo, 0) ?? 0;
  const totCarta = corseOggi?.filter((c) => c.tipo_pagamento === "carta").reduce((s, c) => s + c.importo, 0) ?? 0;
  const totUber = corseOggi?.filter((c) => c.tipo_pagamento === "uber").reduce((s, c) => s + c.importo, 0) ?? 0;
  const totNonInc = corseOggi?.filter((c) => c.tipo_pagamento === "noninc").reduce((s, c) => s + c.importo, 0) ?? 0;
  const totale = totCash + totCarta + totUber;

  const dataOggi = new Date().toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const nomeUtente = autista?.nome?.split(" ")[0] ?? "Marco";
  const inServizio = !!turnoOggi;

  return (
    <div>
      {/* Hero header */}
      <div className="border-b border-border px-6 py-5 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 capitalize">{dataOggi}</p>
            <h1 className="font-heading text-3xl font-semibold text-foreground leading-tight">
              Bentornato, {nomeUtente}.
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                inServizio
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              )}>
                <CheckCircle size={12} weight="fill" />
                {inServizio ? "In servizio" : "Fuori servizio"}
              </span>
              {corseOggi && corseOggi.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {corseOggi.length} {corseOggi.length === 1 ? "corsa" : "corse"} oggi
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/turni/nuovo"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
            >
              <Plus size={13} weight="bold" />
              Turno
            </Link>
            <Link
              href="/dashboard/corse/nuova"
              className={cn(buttonVariants({ size: "sm" }), "text-xs gap-1.5 px-3")}
            >
              <Plus size={13} weight="bold" />
              Registra corsa
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metric tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile
            label="Incassato oggi"
            value={formatEuro(totale)}
            icon={ChartLineUp}
            iconClass="bg-primary/15 text-primary"
            valueClass="text-primary"
          />
          <MetricTile
            label="Cash"
            value={formatEuro(totCash)}
            icon={CurrencyEur}
            iconClass="bg-amber-400/15 text-amber-400"
            valueClass="text-amber-400"
          />
          <MetricTile
            label="Carta"
            value={formatEuro(totCarta)}
            icon={CreditCard}
            iconClass="bg-blue-400/15 text-blue-400"
            valueClass="text-blue-400"
          />
          <MetricTile
            label="Uber"
            value={formatEuro(totUber)}
            icon={Car}
            iconClass="bg-slate-400/15 text-slate-300"
            valueClass="text-foreground"
          />
        </div>

        {totNonInc > 0 && (
          <div className="flex items-center gap-3 bg-card border border-purple-400/20 px-4 py-3 rounded-lg text-sm">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-400/15">
              <Tag size={14} weight="fill" className="text-purple-400" />
            </span>
            <span className="text-muted-foreground">Non incassato:</span>
            <span className="font-mono font-semibold text-purple-400">{formatEuro(totNonInc)}</span>
          </div>
        )}

        {/* Turno */}
        <section>
          <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            <Clock size={12} weight="bold" />
            Turno di oggi
          </h2>
          <div className="bg-card border border-border rounded-lg">
            {turnoOggi ? (
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Inizio</p>
                    <p className="font-mono text-sm font-medium">{turnoOggi.ora_inizio.slice(0, 5)}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fine</p>
                    <p className="font-mono text-sm font-medium">{turnoOggi.ora_fine.slice(0, 5)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Durata</p>
                    <p className="font-mono text-sm font-semibold text-primary">{formatOre(turnoOggi.ore_lavorate)}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/turni/nuovo"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
                >
                  Modifica
                </Link>
              </div>
            ) : (
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Nessun turno registrato per oggi.</p>
                <Link
                  href="/dashboard/turni/nuovo"
                  className={cn(buttonVariants({ size: "sm" }), "text-xs gap-1")}
                >
                  <Plus size={12} weight="bold" />
                  Registra
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Corse */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              <Car size={12} weight="bold" />
              Corse di oggi ({corseOggi?.length ?? 0})
            </h2>
            <Link href="/dashboard/corse" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Vedi tutte <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {!corseOggi?.length && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nessuna corsa registrata oggi.</p>
            )}
            {corseOggi?.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {c.ora_partenza.slice(0, 5)}
                  </span>
                  <PagamentoBadge tipo={c.tipo_pagamento} />
                  <span className="text-sm truncate">{c.origine} → {c.destinazione}</span>
                </div>
                <span className="font-mono text-sm font-medium shrink-0">{formatEuro(c.importo)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, iconClass, valueClass }: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", iconClass)}>
        <Icon size={18} weight="fill" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("font-mono text-2xl font-semibold mt-1 tracking-tight", valueClass ?? "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

const pagamentoBadgeConfig: Record<string, { label: string; style: string; iconStyle: string; icon: React.ElementType }> = {
  cash:   { label: "Cash",   style: "bg-amber-400/10 text-amber-400",   iconStyle: "text-amber-400",  icon: CurrencyEur },
  carta:  { label: "Carta",  style: "bg-blue-400/10 text-blue-400",     iconStyle: "text-blue-400",   icon: CreditCard },
  uber:   { label: "Uber",   style: "bg-muted text-muted-foreground",   iconStyle: "",                icon: Car },
  noninc: { label: "No Inc", style: "bg-purple-400/10 text-purple-400", iconStyle: "text-purple-400", icon: Tag },
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
