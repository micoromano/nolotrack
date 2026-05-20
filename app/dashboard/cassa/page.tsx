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

  const ledgerFiltrato = mese ? ledger.filter(g => g.data.startsWith(mese)) : ledger;
  const saldoAttuale = ledger.length > 0 ? ledger[ledger.length - 1].saldo : 0;

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

  const mesiDisponibili = [...new Set(ledger.map(g => g.data.slice(0, 7)))].sort().reverse();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Cassa</h1>
          <p className="text-xs text-on-surface-variant">Estratto conto e saldo progressivo</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={mese}
            onChange={e => setMese(e.target.value)}
            className="bg-surface-container-lowest border border-border-subtle text-sm text-foreground px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Tutti i periodi</option>
            {mesiDisponibili.map(m => {
              const [anno, mes] = m.split("-");
              const label = new Date(+anno, +mes - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
          <Link href="/dashboard/spese" className={cn(buttonVariants({ size: "sm" }), "text-xs gap-1.5 font-bold uppercase tracking-wide shadow-lg shadow-primary/20")}>
            <Plus size={12} weight="bold" />
            Spesa
          </Link>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden col-span-2 sm:col-span-1 border-primary/30">
            <div className="absolute -right-3 -top-3 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
            <div className="p-2.5 bg-primary/10 rounded-xl w-fit mb-3">
              <Wallet size={18} weight="fill" className="text-primary" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Saldo attuale</p>
            <p className={cn("font-mono text-2xl font-bold", saldoAttuale >= 0 ? "text-primary" : "text-destructive")}>
              {euro(saldoAttuale)}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="p-2.5 bg-amber-400/10 rounded-xl w-fit mb-3">
              <CurrencyEur size={18} weight="fill" className="text-amber-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Cash mese</p>
            <p className="font-mono text-xl font-bold text-amber-400">{euro(totMese.cash)}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="p-2.5 bg-blue-400/10 rounded-xl w-fit mb-3">
              <CreditCard size={18} weight="fill" className="text-blue-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Carte mese</p>
            <p className="font-mono text-xl font-bold text-blue-400">{euro(totMese.carte)}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="p-2.5 bg-rose-400/10 rounded-xl w-fit mb-3">
              <Receipt size={18} weight="fill" className="text-rose-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Spese mese</p>
            <p className="font-mono text-xl font-bold text-rose-400">{euro(totMese.spese)}</p>
          </div>
        </div>

        {/* Ledger table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-7 px-6 py-3 border-b border-border-subtle bg-surface-container-low/50">
            {["Data", "Cash", "Carte", "Uber", "No Inc", "Spese", "Saldo"].map(h => (
              <span key={h} className={cn("text-[11px] font-bold uppercase tracking-wider text-on-secondary-container", h === "Saldo" && "text-right")}>{h}</span>
            ))}
          </div>

          {caricamento && (
            <p className="px-6 py-8 text-sm text-on-surface-variant text-center">Caricamento…</p>
          )}

          {!caricamento && ledgerFiltrato.length === 0 && (
            <p className="px-6 py-8 text-sm text-on-surface-variant text-center">Nessun dato per questo periodo.</p>
          )}

          <div className="divide-y divide-border-subtle">
            {[...ledgerFiltrato].reverse().map(g => (
              <div key={g.data}>
                <div className="hidden sm:grid grid-cols-7 px-6 py-4 hover:bg-surface-variant/20 transition-colors items-center">
                  <span className="text-sm font-medium capitalize text-foreground">
                    {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className={cn("font-mono text-sm", g.cash > 0 ? "text-amber-400" : "text-on-surface-variant/30")}>
                    {g.cash > 0 ? euro(g.cash) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.carte > 0 ? "text-blue-400" : "text-on-surface-variant/30")}>
                    {g.carte > 0 ? euro(g.carte) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.uber > 0 ? "text-foreground" : "text-on-surface-variant/30")}>
                    {g.uber > 0 ? euro(g.uber) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.noninc > 0 ? "text-purple-400" : "text-on-surface-variant/30")}>
                    {g.noninc > 0 ? euro(g.noninc) : "—"}
                  </span>
                  <span className={cn("font-mono text-sm", g.spese > 0 ? "text-destructive" : "text-on-surface-variant/30")}>
                    {g.spese > 0 ? `− ${euro(g.spese)}` : "—"}
                  </span>
                  <span className={cn("font-mono text-sm font-bold text-right", g.saldo >= 0 ? "text-primary" : "text-destructive")}>
                    {euro(g.saldo)}
                  </span>
                </div>

                <div className="sm:hidden px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-foreground">
                      {new Date(g.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className={cn("font-mono text-sm font-bold", g.saldo >= 0 ? "text-primary" : "text-destructive")}>
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

          {ledgerFiltrato.length > 0 && (
            <div className="hidden sm:grid grid-cols-7 px-6 py-4 border-t border-border-subtle bg-surface-container-low/50">
              <span className="text-xs font-bold uppercase tracking-wider text-on-secondary-container">Totale mese</span>
              <span className="font-mono text-sm font-bold text-amber-400">{euro(totMese.cash)}</span>
              <span className="font-mono text-sm font-bold text-blue-400">{euro(totMese.carte)}</span>
              <span className="font-mono text-sm font-bold text-foreground">{euro(totMese.uber)}</span>
              <span className="font-mono text-sm font-bold text-purple-400">{euro(totMese.noninc)}</span>
              <span className="font-mono text-sm font-bold text-destructive">− {euro(totMese.spese)}</span>
              <span className="font-mono text-sm font-bold text-right text-primary">{euro(totMese.cash - totMese.spese)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
