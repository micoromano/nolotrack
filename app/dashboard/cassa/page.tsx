"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wallet, CurrencyEur, CreditCard, Receipt, Plus } from "@phosphor-icons/react";

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

interface GiornoLedger {
  data: string;
  cash: number;
  carte: number;
  uber: number;
  noninc: number;
  spese: number;
  saldo: number;
}

export default function CassaPage() {
  const [ledger, setLedger] = useState<GiornoLedger[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [mese, setMese] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function carica() {
      setCaricamento(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [corseRes, speseRes] = await Promise.all([
        supabase.from("corse").select("data, tipo_pagamento, importo").eq("autista_id", user.id).order("data"),
        supabase.from("spese").select("data, importo").eq("autista_id", user.id).order("data"),
      ]);

      const corse = corseRes.data ?? [];
      const spese = speseRes.data ?? [];

      // Raggruppa per data
      const giorni = new Map<string, GiornoLedger>();

      for (const c of corse) {
        if (!giorni.has(c.data)) giorni.set(c.data, { data: c.data, cash: 0, carte: 0, uber: 0, noninc: 0, spese: 0, saldo: 0 });
        const g = giorni.get(c.data)!;
        if (c.tipo_pagamento === "cash") g.cash += c.importo;
        else if (c.tipo_pagamento === "carta") g.carte += c.importo;
        else if (c.tipo_pagamento === "uber") g.uber += c.importo;
        else if (c.tipo_pagamento === "noninc") g.noninc += c.importo;
      }

      for (const s of spese) {
        if (!giorni.has(s.data)) giorni.set(s.data, { data: s.data, cash: 0, carte: 0, uber: 0, noninc: 0, spese: 0, saldo: 0 });
        giorni.get(s.data)!.spese += s.importo;
      }

      // Ordina cronologicamente e calcola saldo progressivo
      const sorted = [...giorni.values()].sort((a, b) => a.data.localeCompare(b.data));
      let saldoCorr = 0;
      for (const g of sorted) {
        saldoCorr += g.cash - g.spese;
        g.saldo = saldoCorr;
      }

      setLedger(sorted);
      setCaricamento(false);
    }
    carica();
  }, [supabase]);

  // Filtra per mese selezionato
  const ledgerFiltrato = mese
    ? ledger.filter(g => g.data.startsWith(mese))
    : ledger;

  // Saldo corrente (ultimo giorno in assoluto)
  const saldoAttuale = ledger.length > 0 ? ledger[ledger.length - 1].saldo : 0;

  // Totali del mese selezionato
  const totMese = ledgerFiltrato.reduce(
    (acc, g) => ({
      cash: acc.cash + g.cash,
      carte: acc.carte + g.carte,
      uber: acc.uber + g.uber,
      noninc: acc.noninc + g.noninc,
      spese: acc.spese + g.spese,
    }),
    { cash: 0, carte: 0, uber: 0, noninc: 0, spese: 0 }
  );

  // Mesi disponibili
  const mesiDisponibili = [...new Set(ledger.map(g => g.data.slice(0, 7)))].sort().reverse();

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Cassa</h1>
          <p className="text-xs text-muted-foreground">Estratto conto e saldo progressivo</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={mese}
            onChange={e => setMese(e.target.value)}
            className="bg-background border border-border text-sm text-foreground px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Tutti i periodi</option>
            {mesiDisponibili.map(m => {
              const [anno, mes] = m.split("-");
              const label = new Date(+anno, +mes - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
          <Link href="/dashboard/spese" className={cn(buttonVariants({ size: "sm" }), "text-xs gap-1.5")}>
            <Plus size={12} weight="bold" />
            Spesa
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Saldo attuale */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-primary/30 rounded-lg p-4 col-span-2 sm:col-span-1 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
              <Wallet size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Saldo attuale</p>
            <p className={cn("font-mono text-2xl font-semibold mt-1", saldoAttuale >= 0 ? "text-primary" : "text-destructive")}>
              {euro(saldoAttuale)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-amber-400/15 text-amber-400">
              <CurrencyEur size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Cash mese</p>
            <p className="font-mono text-xl font-semibold mt-1 text-amber-400">{euro(totMese.cash)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-blue-400/15 text-blue-400">
              <CreditCard size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Carte mese</p>
            <p className="font-mono text-xl font-semibold mt-1 text-blue-400">{euro(totMese.carte)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-rose-400/15 text-rose-400">
              <Receipt size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Spese mese</p>
            <p className="font-mono text-xl font-semibold mt-1 text-rose-400">{euro(totMese.spese)}</p>
          </div>
        </div>

        {/* Ledger table */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="hidden sm:grid grid-cols-7 px-4 py-2 border-b border-border bg-muted/30">
            {["Data", "Cash", "Carte", "Uber", "No Inc", "Spese", "Saldo"].map(h => (
              <span key={h} className="text-xs font-medium text-muted-foreground uppercase tracking-wider last:text-right">{h}</span>
            ))}
          </div>

          {caricamento && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Caricamento…</p>
          )}

          {!caricamento && ledgerFiltrato.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nessun dato per questo periodo.</p>
          )}

          <div className="divide-y divide-border">
            {[...ledgerFiltrato].reverse().map(g => (
              <div key={g.data}>
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-7 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                  <span className="text-sm font-medium capitalize">
                    {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className={cn("font-mono text-sm", g.cash > 0 ? "text-amber-400" : "text-muted-foreground/40")}>
                    {g.cash > 0 ? euro(g.cash) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.carte > 0 ? "text-blue-400" : "text-muted-foreground/40")}>
                    {g.carte > 0 ? euro(g.carte) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.uber > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                    {g.uber > 0 ? euro(g.uber) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.noninc > 0 ? "text-purple-400" : "text-muted-foreground/40")}>
                    {g.noninc > 0 ? euro(g.noninc) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.spese > 0 ? "text-destructive" : "text-muted-foreground/40")}>
                    {g.spese > 0 ? `− ${euro(g.spese)}` : "—"}
                  </span>
                  <span className={cn("font-mono text-sm font-semibold text-right", g.saldo >= 0 ? "text-primary" : "text-destructive")}>
                    {euro(g.saldo)}
                  </span>
                </div>

                {/* Mobile */}
                <div className="sm:hidden px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className={cn("font-mono text-sm font-semibold", g.saldo >= 0 ? "text-primary" : "text-destructive")}>
                      {euro(g.saldo)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {g.cash > 0 && <span className="text-amber-400">C {euro(g.cash)}</span>}
                    {g.carte > 0 && <span className="text-blue-400">CC {euro(g.carte)}</span>}
                    {g.uber > 0 && <span className="text-foreground">U {euro(g.uber)}</span>}
                    {g.spese > 0 && <span className="text-destructive">− {euro(g.spese)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totali mese */}
          {ledgerFiltrato.length > 0 && (
            <div className="hidden sm:grid grid-cols-7 px-4 py-3 border-t border-border bg-muted/30 font-semibold">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Totale mese</span>
              <span className="font-mono text-sm text-amber-400">{euro(totMese.cash)}</span>
              <span className="font-mono text-sm text-blue-400">{euro(totMese.carte)}</span>
              <span className="font-mono text-sm">{euro(totMese.uber)}</span>
              <span className="font-mono text-sm text-purple-400">{euro(totMese.noninc)}</span>
              <span className="font-mono text-sm text-destructive">− {euro(totMese.spese)}</span>
              <span className="font-mono text-sm text-right text-primary">{euro(totMese.cash - totMese.spese)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
