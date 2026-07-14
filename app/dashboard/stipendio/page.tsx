"use client";

/*
 * SQL richiesto: vedi stipendio_sql.sql nella root del progetto.
 *
 * Formula stipendio mensile:
 *   stipendio_base  = ore_lavorate × tariffa_oraria
 *   comm_cash       = totale_cash  × percentuale_cash
 *   comm_carta      = totale_carta × percentuale_carta
 *   comm_uber       = totale_uber  × percentuale_uber
 *   totale          = stipendio_base + comm_cash + comm_carta + comm_uber
 */

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Money,
  Percent,
  Clock,
  ChartBar,
  ChartLineUp,
  CurrencyEur,
  CreditCard,
  Car,
  Gear,
  FloppyDisk,
  Warning,
  CalendarBlank,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function pct(n: number) {
  return `${(n * 100).toFixed(1).replace(".", ",")} %`;
}

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ConfigSalario {
  id: string;
  tariffa_oraria: number;
  percentuale_cash: number;
  percentuale_carta: number;
  percentuale_uber: number;
}

interface GiornoDetail {
  data: string;
  ore: number;
  cash: number;
  carta: number;
  uber: number;
  noninc: number;
  stipendioBase: number;
  commCash: number;
  commCarta: number;
  commUber: number;
  totaleGiorno: number;
}

// ---------------------------------------------------------------------------
// Bento hero card (riepilogo mensile in stile "Income Overview")
// ---------------------------------------------------------------------------
function HeroCard({
  label,
  value,
  valueClass,
  note,
  colSpan,
}: {
  label: string;
  value: string;
  valueClass?: string;
  note?: React.ReactNode;
  colSpan?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between",
        colSpan && "md:col-span-2"
      )}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
      <div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container">
          {label}
        </span>
        <p
          className={cn(
            "font-mono font-black tracking-tight mt-2",
            colSpan ? "text-4xl md:text-5xl" : "text-2xl",
            valueClass ?? "text-foreground"
          )}
        >
          {value}
        </p>
      </div>
      {note && (
        <div className="flex items-center gap-1.5 mt-4 text-on-surface-variant text-xs font-mono">
          {note}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input helper
// ---------------------------------------------------------------------------
const inputCls =
  "w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StipendioPage() {
  const supabase = createClient();

  const [mese, setMese] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [config, setConfig] = useState<ConfigSalario | null>(null);
  const [configCaricamento, setConfigCaricamento] = useState(true);
  const [datiCaricamento, setDatiCaricamento] = useState(true);
  const [giorni, setGiorni] = useState<GiornoDetail[]>([]);
  const [mesiDisponibili, setMesiDisponibili] = useState<string[]>([]);

  // Config form state
  const [configForm, setConfigForm] = useState({
    tariffa_oraria: "",
    percentuale_cash: "",
    percentuale_carta: "",
    percentuale_uber: "",
  });
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [erroreConfig, setErroreConfig] = useState<string | null>(null);
  const [configSalvata, setConfigSalvata] = useState(false);
  const [mostraConfig, setMostraConfig] = useState(false);

  // ---------------------------------------------------------------------------
  // Load config
  // ---------------------------------------------------------------------------
  const caricaConfig = useCallback(async () => {
    setConfigCaricamento(true);

    // La tabella configurazione_salario ha una singola riga globale (nessun autista_id).
    const { data } = await supabase
      .from("configurazione_salario")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setConfig(data as ConfigSalario);
      setConfigForm({
        tariffa_oraria: String(data.tariffa_oraria),
        percentuale_cash: String((data.percentuale_cash * 100).toFixed(2)),
        percentuale_carta: String((data.percentuale_carta * 100).toFixed(2)),
        percentuale_uber: String((data.percentuale_uber * 100).toFixed(2)),
      });
    } else {
      setConfig(null);
      setMostraConfig(true);
    }
    setConfigCaricamento(false);
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // Load month data
  // ---------------------------------------------------------------------------
  const caricaDati = useCallback(
    async (meseSel: string, cfg: ConfigSalario | null) => {
      setDatiCaricamento(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const inizioMese = `${meseSel}-01`;
      const [anno, m] = meseSel.split("-").map(Number);
      const fineMese = new Date(anno, m, 0).toISOString().split("T")[0]; // ultimo giorno del mese

      const [turniRes, corseRes] = await Promise.all([
        supabase
          .from("turni")
          .select("data, ore_lavorate")
          .eq("autista_id", user.id)
          .gte("data", inizioMese)
          .lte("data", fineMese),
        supabase
          .from("corse")
          .select("data, tipo_pagamento, importo")
          .eq("autista_id", user.id)
          .gte("data", inizioMese)
          .lte("data", fineMese),
      ]);

      // Collect mesi disponibili (from turni)
      const { data: tuttiTurni } = await supabase
        .from("turni")
        .select("data")
        .eq("autista_id", user.id);
      if (tuttiTurni) {
        const mesiSet = [...new Set(tuttiTurni.map((t) => t.data.slice(0, 7)))].sort().reverse();
        setMesiDisponibili(mesiSet);
      }

      const turni = turniRes.data ?? [];
      const corse = corseRes.data ?? [];

      // Raggruppa per data
      const map = new Map<
        string,
        { ore: number; cash: number; carta: number; uber: number; noninc: number }
      >();

      for (const t of turni) {
        if (!map.has(t.data)) map.set(t.data, { ore: 0, cash: 0, carta: 0, uber: 0, noninc: 0 });
        map.get(t.data)!.ore += t.ore_lavorate;
      }

      for (const c of corse) {
        if (!map.has(c.data)) map.set(c.data, { ore: 0, cash: 0, carta: 0, uber: 0, noninc: 0 });
        const g = map.get(c.data)!;
        if (c.tipo_pagamento === "cash") g.cash += c.importo;
        else if (c.tipo_pagamento === "carta") g.carta += c.importo;
        else if (c.tipo_pagamento === "uber") g.uber += c.importo;
        else if (c.tipo_pagamento === "noninc") g.noninc += c.importo;
      }

      const tarOr = cfg?.tariffa_oraria ?? 0;
      const pctCash = cfg?.percentuale_cash ?? 0;
      const pctCarta = cfg?.percentuale_carta ?? 0;
      const pctUber = cfg?.percentuale_uber ?? 0;

      const risultato: GiornoDetail[] = [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, g]) => {
          const stipendioBase = g.ore * tarOr;
          const commCash = g.cash * pctCash;
          const commCarta = g.carta * pctCarta;
          const commUber = g.uber * pctUber;
          return {
            data,
            ore: g.ore,
            cash: g.cash,
            carta: g.carta,
            uber: g.uber,
            noninc: g.noninc,
            stipendioBase,
            commCash,
            commCarta,
            commUber,
            totaleGiorno: stipendioBase + commCash + commCarta + commUber,
          };
        });

      setGiorni(risultato);
      setDatiCaricamento(false);
    },
    [supabase]
  );

  useEffect(() => {
    caricaConfig();
  }, [caricaConfig]);

  useEffect(() => {
    if (!configCaricamento) {
      caricaDati(mese, config);
    }
  }, [mese, config, configCaricamento, caricaDati]);

  // ---------------------------------------------------------------------------
  // Save config
  // ---------------------------------------------------------------------------
  async function salvaConfig(e: React.FormEvent) {
    e.preventDefault();
    setErroreConfig(null);
    setConfigSalvata(false);

    const tarOr = parseFloat(configForm.tariffa_oraria.replace(",", "."));
    const pctCash = parseFloat(configForm.percentuale_cash.replace(",", ".")) / 100;
    const pctCarta = parseFloat(configForm.percentuale_carta.replace(",", ".")) / 100;
    const pctUber = parseFloat(configForm.percentuale_uber.replace(",", ".")) / 100;

    if (
      isNaN(tarOr) || isNaN(pctCash) || isNaN(pctCarta) || isNaN(pctUber) ||
      tarOr < 0 || pctCash < 0 || pctCarta < 0 || pctUber < 0
    ) {
      setErroreConfig("Inserisci valori numerici validi e non negativi.");
      return;
    }

    setSalvandoConfig(true);

    const payload = {
      tariffa_oraria: tarOr,
      percentuale_cash: pctCash,
      percentuale_carta: pctCarta,
      percentuale_uber: pctUber,
      aggiornato_il: new Date().toISOString(),
    };

    const { error } = config
      ? await supabase
          .from("configurazione_salario")
          .update(payload)
          .eq("id", config.id)
      : await supabase.from("configurazione_salario").insert(payload);

    if (error) {
      setErroreConfig(error.message);
    } else {
      setConfigSalvata(true);
      setMostraConfig(false);
      await caricaConfig();
    }
    setSalvandoConfig(false);
  }

  // ---------------------------------------------------------------------------
  // Totali mese
  // ---------------------------------------------------------------------------
  const tot = giorni.reduce(
    (acc, g) => ({
      ore: acc.ore + g.ore,
      cash: acc.cash + g.cash,
      carta: acc.carta + g.carta,
      uber: acc.uber + g.uber,
      stipendioBase: acc.stipendioBase + g.stipendioBase,
      commissioni: acc.commissioni + g.commCash + g.commCarta + g.commUber,
      totale: acc.totale + g.totaleGiorno,
    }),
    { ore: 0, cash: 0, carta: 0, uber: 0, stipendioBase: 0, commissioni: 0, totale: 0 }
  );

  // Massimi usati per dimensionare grafico giornaliero e barre "Ripartizione incassi"
  const maxTotaleGiorno = giorni.reduce((m, g) => Math.max(m, g.totaleGiorno), 0);
  const maxIncasso = Math.max(tot.cash, tot.carta, tot.uber);

  const meseFmt = (() => {
    const [anno, m] = mese.split("-");
    return new Date(+anno, +m - 1).toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    });
  })();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Stipendio</h1>
          <p className="text-xs text-on-surface-variant capitalize">{meseFmt}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={mese}
            onChange={(e) => setMese(e.target.value)}
            className="bg-surface-container-lowest border border-border-subtle text-sm text-foreground px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
          >
            {mesiDisponibili.length === 0 && (
              <option value={mese}>{meseFmt}</option>
            )}
            {mesiDisponibili.map((m) => {
              const [anno, mes] = m.split("-");
              const label = new Date(+anno, +mes - 1).toLocaleDateString("it-IT", {
                month: "long",
                year: "numeric",
              });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => setMostraConfig((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors uppercase tracking-wide",
              mostraConfig
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-surface-container border-border-subtle text-on-surface-variant hover:text-foreground"
            )}
          >
            <Gear size={13} weight="bold" />
            Config
          </button>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-6">
        {/* Avviso: nessuna config */}
        {!configCaricamento && !config && (
          <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3">
            <Warning size={16} weight="fill" className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-400">
              Nessuna configurazione salario trovata. Imposta tariffa oraria e percentuali qui sotto
              per calcolare lo stipendio.
            </p>
          </div>
        )}

        {/* Pannello configurazione */}
        {mostraConfig && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border-subtle px-5 py-3 flex items-center gap-2">
              <Gear size={13} weight="bold" className="text-on-surface-variant" />
              <span className="text-[11px] font-bold text-on-secondary-container uppercase tracking-wider">
                Configurazione salario
              </span>
            </div>
            <form onSubmit={salvaConfig} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Tariffa oraria */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Tariffa oraria (€/h)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-bold pointer-events-none">
                      €
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={configForm.tariffa_oraria}
                      onChange={(e) =>
                        setConfigForm((f) => ({ ...f, tariffa_oraria: e.target.value }))
                      }
                      className={cn(inputCls, "pl-7")}
                    />
                  </div>
                </div>

                {/* % Cash */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    % sul cash
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,0"
                      value={configForm.percentuale_cash}
                      onChange={(e) =>
                        setConfigForm((f) => ({ ...f, percentuale_cash: e.target.value }))
                      }
                      className={cn(inputCls, "pr-7")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-bold pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* % Carta */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    % sulle carte
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,0"
                      value={configForm.percentuale_carta}
                      onChange={(e) =>
                        setConfigForm((f) => ({ ...f, percentuale_carta: e.target.value }))
                      }
                      className={cn(inputCls, "pr-7")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-bold pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* % Uber */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    % sull&apos;Uber
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,0"
                      value={configForm.percentuale_uber}
                      onChange={(e) =>
                        setConfigForm((f) => ({ ...f, percentuale_uber: e.target.value }))
                      }
                      className={cn(inputCls, "pr-7")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-bold pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {erroreConfig && (
                <p className="text-xs text-destructive">{erroreConfig}</p>
              )}
              {configSalvata && (
                <p className="text-xs text-primary">Configurazione salvata correttamente.</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <FloppyDisk size={14} weight="bold" />
                  {salvandoConfig ? "Salvataggio…" : "Salva configurazione"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Config summary banner (when config exists and panel is closed) */}
        {!mostraConfig && config && (
          <div className="flex items-center gap-4 glass-card rounded-xl px-4 py-2.5 text-xs text-on-surface-variant flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={11} weight="bold" />
              <span>Tariffa: <span className="font-mono text-foreground">{euro(config.tariffa_oraria)}/h</span></span>
            </span>
            <span className="flex items-center gap-1">
              <CurrencyEur size={11} weight="bold" />
              <span>Cash: <span className="font-mono text-foreground">{pct(config.percentuale_cash)}</span></span>
            </span>
            <span className="flex items-center gap-1">
              <CreditCard size={11} weight="bold" />
              <span>Carta: <span className="font-mono text-foreground">{pct(config.percentuale_carta)}</span></span>
            </span>
            <span className="flex items-center gap-1">
              <Car size={11} weight="bold" />
              <span>Uber: <span className="font-mono text-foreground">{pct(config.percentuale_uber)}</span></span>
            </span>
          </div>
        )}

        {/* Bento grid — riepilogo mensile */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <HeroCard
            colSpan
            label="Totale stipendio"
            value={euro(tot.totale)}
            valueClass="text-primary"
            note={
              <>
                <ChartBar size={13} weight="bold" />
                <span>
                  Base {euro(tot.stipendioBase)} + Commissioni {euro(tot.commissioni)}
                </span>
              </>
            }
          />
          <HeroCard
            label="Ore lavorate"
            value={formatOre(tot.ore)}
            note={
              <>
                <Clock size={13} weight="bold" />
                <span>
                  {config ? `Tariffa ${euro(config.tariffa_oraria)}/h` : "Nessuna tariffa impostata"}
                </span>
              </>
            }
          />
          <HeroCard
            label="Commissioni"
            value={euro(tot.commissioni)}
            valueClass="text-violet-400"
            note={
              <>
                <Percent size={13} weight="bold" />
                <span>Cash + carta + Uber</span>
              </>
            }
          />
        </section>

        {/* Grafico giornaliero + ripartizione incassi */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Andamento giornaliero */}
          <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[11px] font-bold text-on-secondary-container uppercase tracking-wider flex items-center gap-2">
                <ChartLineUp size={13} weight="bold" />
                Andamento giornaliero — {meseFmt}
              </p>
            </div>

            {datiCaricamento && (
              <p className="py-16 text-sm text-on-surface-variant text-center">Caricamento…</p>
            )}
            {!datiCaricamento && giorni.length === 0 && (
              <p className="py-16 text-sm text-on-surface-variant text-center">Nessun dato per {meseFmt}.</p>
            )}
            {!datiCaricamento && giorni.length > 0 && (
              <div className="overflow-x-auto">
                <div
                  className="h-48 flex items-end gap-1.5 px-1"
                  style={{ minWidth: giorni.length * 22 }}
                >
                  {giorni.map((g) => {
                    const altezza =
                      maxTotaleGiorno > 0
                        ? Math.max((g.totaleGiorno / maxTotaleGiorno) * 100, g.totaleGiorno > 0 ? 4 : 1)
                        : 1;
                    return (
                      <div key={g.data} className="flex-1 min-w-[14px] flex flex-col items-center gap-2 group relative">
                        <div
                          className="w-full bg-primary/20 rounded-t-md relative transition-all duration-300"
                          style={{ height: `${altezza}%` }}
                        >
                          <div className="absolute inset-0 bg-primary opacity-40 group-hover:opacity-100 transition-opacity rounded-t-md" />
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-surface border border-border-subtle px-2 py-1 rounded text-[10px] font-mono hidden group-hover:block whitespace-nowrap z-10">
                            {euro(g.totaleGiorno)}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-on-surface-variant">
                          {g.data.slice(8, 10)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ripartizione incassi */}
          <div className="glass-card p-6 md:p-8 rounded-2xl flex flex-col">
            <p className="text-[11px] font-bold text-on-secondary-container uppercase tracking-wider flex items-center gap-2 mb-6">
              <Money size={13} weight="bold" />
              Ripartizione incassi
            </p>
            <div className="space-y-5 flex-1">
              <TierRow
                label="Cash"
                amount={tot.cash}
                maxAmount={maxIncasso}
                barClass="bg-amber-400"
                valueClass="text-amber-400"
                pctVal={config?.percentuale_cash ?? 0}
                commissione={tot.cash * (config?.percentuale_cash ?? 0)}
                mostraFormula={!!config}
              />
              <TierRow
                label="Carte"
                amount={tot.carta}
                maxAmount={maxIncasso}
                barClass="bg-indigo-400"
                valueClass="text-indigo-400"
                pctVal={config?.percentuale_carta ?? 0}
                commissione={tot.carta * (config?.percentuale_carta ?? 0)}
                mostraFormula={!!config}
              />
              <TierRow
                label="Uber"
                amount={tot.uber}
                maxAmount={maxIncasso}
                barClass="bg-slate-300"
                valueClass="text-foreground"
                pctVal={config?.percentuale_uber ?? 0}
                commissione={tot.uber * (config?.percentuale_uber ?? 0)}
                mostraFormula={!!config}
              />
            </div>
            <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between text-sm font-semibold">
              <span className="text-on-surface-variant">Totale commissioni</span>
              <span className="font-mono text-violet-400">{euro(tot.commissioni)}</span>
            </div>
          </div>
        </section>

        {/* Lista giorni del mese */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="text-[11px] font-bold text-on-secondary-container uppercase tracking-wider flex items-center gap-2">
              <CalendarBlank size={13} weight="bold" />
              Dettaglio giornaliero — {meseFmt}
            </p>
          </div>

          <div className="hidden sm:grid grid-cols-8 px-5 py-3 bg-surface-container-low/50 border-b border-border-subtle">
            {["Data", "Ore", "Cash", "Carte", "Uber", "Base", "Comm.", "Totale"].map((h) => (
              <span key={h} className={cn("text-[11px] font-bold uppercase tracking-wider text-on-secondary-container", h === "Totale" && "text-right")}>
                {h}
              </span>
            ))}
          </div>

          {datiCaricamento && (
            <p className="px-5 py-8 text-sm text-on-surface-variant text-center">Caricamento…</p>
          )}

          {!datiCaricamento && giorni.length === 0 && (
            <p className="px-5 py-8 text-sm text-on-surface-variant text-center">Nessun dato per {meseFmt}.</p>
          )}

          <div className="divide-y divide-border-subtle">
            {[...giorni].reverse().map((g) => (
              <div key={g.data}>
                <div className="hidden sm:grid grid-cols-8 px-5 py-4 hover:bg-surface-variant/20 transition-colors items-center">
                  <span className="text-sm font-medium capitalize text-foreground">
                    {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className={cn("font-mono text-sm", g.ore > 0 ? "text-blue-400" : "text-on-surface-variant/30")}>{g.ore > 0 ? formatOre(g.ore) : "—"}</span>
                  <span className={cn("font-mono text-sm", g.cash > 0 ? "text-amber-400" : "text-on-surface-variant/30")}>{g.cash > 0 ? euro(g.cash) : "—"}</span>
                  <span className={cn("font-mono text-sm", g.carta > 0 ? "text-indigo-400" : "text-on-surface-variant/30")}>{g.carta > 0 ? euro(g.carta) : "—"}</span>
                  <span className={cn("font-mono text-sm", g.uber > 0 ? "text-foreground" : "text-on-surface-variant/30")}>{g.uber > 0 ? euro(g.uber) : "—"}</span>
                  <span className={cn("font-mono text-sm", g.stipendioBase > 0 ? "text-teal-400" : "text-on-surface-variant/30")}>{g.stipendioBase > 0 ? euro(g.stipendioBase) : "—"}</span>
                  <span className={cn("font-mono text-sm", (g.commCash + g.commCarta + g.commUber) > 0 ? "text-violet-400" : "text-on-surface-variant/30")}>{(g.commCash + g.commCarta + g.commUber) > 0 ? euro(g.commCash + g.commCarta + g.commUber) : "—"}</span>
                  <span className="font-mono text-sm font-bold text-right text-primary">{euro(g.totaleGiorno)}</span>
                </div>

                <div className="sm:hidden px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-foreground">
                      {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="font-mono text-sm font-bold text-primary">{euro(g.totaleGiorno)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                    {g.ore > 0 && <span className="text-blue-400">{formatOre(g.ore)}</span>}
                    {g.cash > 0 && <span className="text-amber-400">C {euro(g.cash)}</span>}
                    {g.carta > 0 && <span className="text-indigo-400">CC {euro(g.carta)}</span>}
                    {g.uber > 0 && <span className="text-foreground">U {euro(g.uber)}</span>}
                    {g.stipendioBase > 0 && <span className="text-teal-400">Base {euro(g.stipendioBase)}</span>}
                    {(g.commCash + g.commCarta + g.commUber) > 0 && <span className="text-violet-400">Comm. {euro(g.commCash + g.commCarta + g.commUber)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {giorni.length > 0 && (
            <div className="hidden sm:grid grid-cols-8 px-5 py-4 border-t border-border-subtle bg-surface-container-low/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container self-center">Totale</span>
              <span className="font-mono text-sm font-bold text-blue-400">{formatOre(tot.ore)}</span>
              <span className="font-mono text-sm font-bold text-amber-400">{euro(tot.cash)}</span>
              <span className="font-mono text-sm font-bold text-indigo-400">{euro(tot.carta)}</span>
              <span className="font-mono text-sm font-bold text-foreground">{euro(tot.uber)}</span>
              <span className="font-mono text-sm font-bold text-teal-400">{euro(tot.stipendioBase)}</span>
              <span className="font-mono text-sm font-bold text-violet-400">{euro(tot.commissioni)}</span>
              <span className="font-mono text-sm font-bold text-right text-primary">{euro(tot.totale)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TierRow helper — riga "Ripartizione incassi" (cash / carta / uber)
// ---------------------------------------------------------------------------
function TierRow({
  label,
  amount,
  maxAmount,
  barClass,
  valueClass,
  pctVal,
  commissione,
  mostraFormula,
}: {
  label: string;
  amount: number;
  maxAmount: number;
  barClass: string;
  valueClass: string;
  pctVal: number;
  commissione: number;
  mostraFormula: boolean;
}) {
  const larghezza = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, amount > 0 ? 3 : 0) : 0;
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-on-surface-variant">{label}</span>
        <span className={cn("font-mono text-sm font-semibold", valueClass)}>{euro(amount)}</span>
      </div>
      <div className="w-full bg-surface-container rounded-full h-2">
        <div className={cn("h-2 rounded-full transition-all", barClass)} style={{ width: `${larghezza}%` }} />
      </div>
      {mostraFormula && (
        <p className="text-[11px] text-on-surface-variant/70 font-mono mt-1.5">
          {euro(amount)} × {pct(pctVal)} = {euro(commissione)}
        </p>
      )}
    </div>
  );
}
