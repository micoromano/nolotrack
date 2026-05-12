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
// Metric tile
// ---------------------------------------------------------------------------
function Tile({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  valueClass,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass: string;
  valueClass?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-4 relative overflow-hidden",
        accent ? "border-primary/30" : "border-border"
      )}
    >
      <div
        className={cn(
          "absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center",
          iconClass
        )}
      >
        <Icon size={18} weight="fill" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">{label}</p>
      <p className={cn("font-mono text-xl font-semibold mt-1", valueClass ?? "text-foreground")}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Input helper
// ---------------------------------------------------------------------------
const inputCls =
  "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono";

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
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Stipendio</h1>
          <p className="text-xs text-muted-foreground capitalize">{meseFmt}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={mese}
            onChange={(e) => setMese(e.target.value)}
            className="bg-background border border-border text-sm text-foreground px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
              mostraConfig
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80"
            )}
          >
            <Gear size={13} weight="bold" />
            Configurazione
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Avviso: nessuna config */}
        {!configCaricamento && !config && (
          <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/20 rounded-lg px-4 py-3">
            <Warning size={16} weight="fill" className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-400">
              Nessuna configurazione salario trovata. Imposta tariffa oraria e percentuali qui sotto
              per calcolare lo stipendio.
            </p>
          </div>
        )}

        {/* Pannello configurazione */}
        {mostraConfig && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
              <Gear size={13} weight="bold" className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
          <div className="flex items-center gap-4 bg-card border border-border rounded-lg px-4 py-2.5 text-xs text-muted-foreground flex-wrap">
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

        {/* Tile riepilogativi */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile
            label="Ore totali"
            value={formatOre(tot.ore)}
            icon={Clock}
            iconClass="bg-blue-400/15 text-blue-400"
            valueClass="text-blue-400"
          />
          <Tile
            label="Totale cash"
            value={euro(tot.cash)}
            icon={CurrencyEur}
            iconClass="bg-amber-400/15 text-amber-400"
            valueClass="text-amber-400"
          />
          <Tile
            label="Totale carte"
            value={euro(tot.carta)}
            icon={CreditCard}
            iconClass="bg-indigo-400/15 text-indigo-400"
            valueClass="text-indigo-400"
          />
          <Tile
            label="Totale uber"
            value={euro(tot.uber)}
            icon={Car}
            iconClass="bg-slate-400/15 text-slate-300"
            valueClass="text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile
            label="Stipendio base (ore)"
            value={euro(tot.stipendioBase)}
            sub={config ? `${formatOre(tot.ore)} × ${euro(config.tariffa_oraria)}/h` : undefined}
            icon={Clock}
            iconClass="bg-teal-400/15 text-teal-400"
            valueClass="text-teal-400"
          />
          <Tile
            label="Commissioni"
            value={euro(tot.commissioni)}
            sub={config ? `cash + carta + uber` : undefined}
            icon={Percent}
            iconClass="bg-violet-400/15 text-violet-400"
            valueClass="text-violet-400"
          />
          <Tile
            label="Totale stipendio"
            value={euro(tot.totale)}
            sub={meseFmt}
            icon={Money}
            iconClass="bg-primary/15 text-primary"
            valueClass="text-primary text-2xl"
            accent
          />
        </div>

        {/* Dettaglio commissioni */}
        {config && (tot.cash > 0 || tot.carta > 0 || tot.uber > 0) && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ChartBar size={13} weight="bold" />
                Dettaglio commissioni
              </p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <CommRow
                label="Cash"
                base={tot.cash}
                pct={config.percentuale_cash}
                result={tot.cash * config.percentuale_cash}
                colorClass="text-amber-400"
              />
              <CommRow
                label="Carte"
                base={tot.carta}
                pct={config.percentuale_carta}
                result={tot.carta * config.percentuale_carta}
                colorClass="text-indigo-400"
              />
              <CommRow
                label="Uber"
                base={tot.uber}
                pct={config.percentuale_uber}
                result={tot.uber * config.percentuale_uber}
                colorClass="text-slate-300"
              />
              <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Totale commissioni</span>
                <span className="font-mono text-violet-400">{euro(tot.commissioni)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Lista giorni del mese */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <CalendarBlank size={13} weight="bold" />
              Dettaglio giornaliero — {meseFmt}
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-8 px-4 py-2 bg-muted/30 border-b border-border">
            {["Data", "Ore", "Cash", "Carte", "Uber", "Base", "Comm.", "Totale"].map((h) => (
              <span
                key={h}
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider last:text-right"
              >
                {h}
              </span>
            ))}
          </div>

          {datiCaricamento && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Caricamento…</p>
          )}

          {!datiCaricamento && giorni.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Nessun dato per {meseFmt}.
            </p>
          )}

          <div className="divide-y divide-border">
            {[...giorni].reverse().map((g) => (
              <div key={g.data}>
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-8 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                  <span className="text-sm font-medium capitalize">
                    {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className={cn("font-mono text-sm", g.ore > 0 ? "text-blue-400" : "text-muted-foreground/40")}>
                    {g.ore > 0 ? formatOre(g.ore) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.cash > 0 ? "text-amber-400" : "text-muted-foreground/40")}>
                    {g.cash > 0 ? euro(g.cash) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.carta > 0 ? "text-indigo-400" : "text-muted-foreground/40")}>
                    {g.carta > 0 ? euro(g.carta) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.uber > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                    {g.uber > 0 ? euro(g.uber) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.stipendioBase > 0 ? "text-teal-400" : "text-muted-foreground/40")}>
                    {g.stipendioBase > 0 ? euro(g.stipendioBase) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", (g.commCash + g.commCarta + g.commUber) > 0 ? "text-violet-400" : "text-muted-foreground/40")}>
                    {(g.commCash + g.commCarta + g.commUber) > 0 ? euro(g.commCash + g.commCarta + g.commUber) : "—"}
                  </span>
                  <span className="font-mono text-sm font-semibold text-right text-primary">
                    {euro(g.totaleGiorno)}
                  </span>
                </div>

                {/* Mobile */}
                <div className="sm:hidden px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="font-mono text-sm font-semibold text-primary">
                      {euro(g.totaleGiorno)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                    {g.ore > 0 && <span className="text-blue-400">{formatOre(g.ore)}</span>}
                    {g.cash > 0 && <span className="text-amber-400">C {euro(g.cash)}</span>}
                    {g.carta > 0 && <span className="text-indigo-400">CC {euro(g.carta)}</span>}
                    {g.uber > 0 && <span className="text-foreground">U {euro(g.uber)}</span>}
                    {g.stipendioBase > 0 && (
                      <span className="text-teal-400">Base {euro(g.stipendioBase)}</span>
                    )}
                    {(g.commCash + g.commCarta + g.commUber) > 0 && (
                      <span className="text-violet-400">
                        Comm. {euro(g.commCash + g.commCarta + g.commUber)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer totali */}
          {giorni.length > 0 && (
            <div className="hidden sm:grid grid-cols-8 px-4 py-3 border-t border-border bg-muted/30 font-semibold">
              <span className="text-xs text-muted-foreground uppercase tracking-wider self-center">
                Totale
              </span>
              <span className="font-mono text-sm text-blue-400">{formatOre(tot.ore)}</span>
              <span className="font-mono text-sm text-amber-400">{euro(tot.cash)}</span>
              <span className="font-mono text-sm text-indigo-400">{euro(tot.carta)}</span>
              <span className="font-mono text-sm">{euro(tot.uber)}</span>
              <span className="font-mono text-sm text-teal-400">{euro(tot.stipendioBase)}</span>
              <span className="font-mono text-sm text-violet-400">{euro(tot.commissioni)}</span>
              <span className="font-mono text-sm font-bold text-right text-primary">
                {euro(tot.totale)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommRow helper
// ---------------------------------------------------------------------------
function CommRow({
  label,
  base,
  pct: pctVal,
  result,
  colorClass,
}: {
  label: string;
  base: number;
  pct: number;
  result: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-12">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {euro(base)} × {pct(pctVal)}
        </span>
      </div>
      <span className={cn("font-mono font-medium", colorClass)}>{euro(result)}</span>
    </div>
  );
}
