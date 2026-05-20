"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const PDFButton = dynamic(() => import("./pdf"), { ssr: false });

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function prevDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

interface Corsa {
  ora_partenza: string;
  origine: string;
  destinazione: string;
  tipo_pagamento: string;
  importo: number;
  note?: string | null;
}

interface SpesaItem {
  id: string;
  descrizione: string;
  importo: number;
}

interface Rapportino {
  turno: { ora_inizio: string; ora_fine: string; ore_lavorate: number } | null;
  corse: Corsa[];
  spese: SpesaItem[];
  totCash: number;
  totCarte: number;
  totUber: number;
  totNonInc: number;
  totSpese: number;
  saldoPrev: number;
  saldoOggi: number;
  ultimoGiornoLavorativo: string | null;
}

export default function ReportPage() {
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [rapportino, setRapportino] = useState<Rapportino | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const [nuovaSpesaDesc, setNuovaSpesaDesc] = useState("");
  const [nuovaSpesaImporto, setNuovaSpesaImporto] = useState("");
  const [salvandoSpesa, setSalvandoSpesa] = useState(false);
  const supabase = createClient();

  const caricaRapportino = useCallback(async (dataSelezionata: string) => {
    setCaricamento(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [turnoRes, corseRes, speseGiornoRes, cashPrecRes, spesePrecRes, ultimoGiornoRes] = await Promise.allSettled([
      supabase.from("turni").select("*").eq("autista_id", user.id).eq("data", dataSelezionata).maybeSingle(),
      supabase.from("corse").select("*").eq("autista_id", user.id).eq("data", dataSelezionata).order("ora_partenza"),
      supabase.from("spese").select("*").eq("autista_id", user.id).eq("data", dataSelezionata).order("created_at"),
      supabase.from("corse").select("importo, tipo_pagamento").eq("autista_id", user.id).eq("tipo_pagamento", "cash").lt("data", dataSelezionata),
      supabase.from("spese").select("importo").eq("autista_id", user.id).lt("data", dataSelezionata),
      supabase.from("corse").select("data").eq("autista_id", user.id).lt("data", dataSelezionata).order("data", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const turno = turnoRes.status === "fulfilled" ? turnoRes.value.data : null;
    const corse = corseRes.status === "fulfilled" ? corseRes.value.data : null;
    const speseGiorno = speseGiornoRes.status === "fulfilled" ? speseGiornoRes.value.data : null;
    const cashPrec = cashPrecRes.status === "fulfilled" ? cashPrecRes.value.data : null;
    const spesePrec = spesePrecRes.status === "fulfilled" ? spesePrecRes.value.data : null;
    const ultimoGiorno = ultimoGiornoRes.status === "fulfilled" ? ultimoGiornoRes.value.data?.data ?? null : null;

    const corseList: Corsa[] = corse ?? [];
    const speseList: SpesaItem[] = (speseGiorno as SpesaItem[] | null) ?? [];

    const totCash = corseList.filter(c => c.tipo_pagamento === "cash").reduce((s, c) => s + c.importo, 0);
    const totCarte = corseList.filter(c => c.tipo_pagamento === "carta").reduce((s, c) => s + c.importo, 0);
    const totUber = corseList.filter(c => c.tipo_pagamento === "uber").reduce((s, c) => s + c.importo, 0);
    const totNonInc = corseList.filter(c => c.tipo_pagamento === "noninc").reduce((s, c) => s + c.importo, 0);
    const totSpese = speseList.reduce((s, sp) => s + sp.importo, 0);

    const cashPrecTot = (cashPrec as { importo: number }[] | null)?.reduce((s, c) => s + c.importo, 0) ?? 0;
    const spesePrecTot = (spesePrec as { importo: number }[] | null)?.reduce((s, c) => s + c.importo, 0) ?? 0;
    const saldoPrev = cashPrecTot - spesePrecTot;
    const saldoOggi = saldoPrev + totCash - totSpese;

    setRapportino({
      turno: turno ?? null,
      corse: corseList,
      spese: speseList,
      totCash, totCarte, totUber, totNonInc, totSpese,
      saldoPrev, saldoOggi,
      ultimoGiornoLavorativo: ultimoGiorno,
    });
    setCaricamento(false);
  }, [supabase]);

  useEffect(() => { caricaRapportino(data); }, [data, caricaRapportino]);

  async function aggiungiSpesa(e: React.FormEvent) {
    e.preventDefault();
    if (!nuovaSpesaDesc || !nuovaSpesaImporto) return;
    setSalvandoSpesa(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("spese").insert({
      autista_id: user!.id,
      data,
      descrizione: nuovaSpesaDesc,
      importo: parseFloat(nuovaSpesaImporto),
    });
    setNuovaSpesaDesc("");
    setNuovaSpesaImporto("");
    setSalvandoSpesa(false);
    await caricaRapportino(data);
  }

  async function eliminaSpesa(id: string) {
    await supabase.from("spese").delete().eq("id", id);
    await caricaRapportino(data);
  }

  const dataPrev = rapportino?.ultimoGiornoLavorativo ?? prevDay(data);
  const dataFmt = new Date(data + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Report giornaliero</h1>
          <p className="text-xs text-muted-foreground capitalize">{dataFmt}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="bg-background border border-border text-sm text-foreground px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {rapportino && !caricamento && (
            <PDFButton
              data={data}
              turno={rapportino.turno}
              corse={rapportino.corse}
              spese={rapportino.spese}
              totCash={rapportino.totCash}
              totCarte={rapportino.totCarte}
              totUber={rapportino.totUber}
              totNonInc={rapportino.totNonInc}
              totSpese={rapportino.totSpese}
              saldoPrev={rapportino.saldoPrev}
              saldoOggi={rapportino.saldoOggi}
              dataPrev={dataPrev}
            />
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {caricamento && (
          <p className="text-sm text-muted-foreground">Caricamento…</p>
        )}

        {rapportino && !caricamento && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Orari */}
              <section className="bg-card border border-border rounded-lg">
                <div className="border-b border-border px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Orari</p>
                </div>
                {rapportino.turno ? (
                  <div className="px-4 py-3 space-y-2">
                    <Row label="Inizio" value={rapportino.turno.ora_inizio.slice(0, 5)} mono />
                    <Row label="Fine" value={rapportino.turno.ora_fine.slice(0, 5)} mono />
                    <Row label="Totale ore" value={formatOre(rapportino.turno.ore_lavorate)} mono accent />
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Nessun turno registrato.</p>
                )}
              </section>

              {/* Flussi */}
              <section className="bg-card border border-border rounded-lg">
                <div className="border-b border-border px-4 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Flussi cassa</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <Row
                    label={`Cassa al ${new Date(dataPrev + "T00:00:00").toLocaleDateString("it-IT")}`}
                    value={euro(rapportino.saldoPrev)}
                    mono
                  />
                  <Row label="+ Entrate cash" value={euro(rapportino.totCash)} mono />
                  <Row label="− Uscite (spese)" value={euro(rapportino.totSpese)} mono />
                  <div className="border-t border-border pt-2 mt-2">
                    <Row
                      label={`Cassa al ${new Date(data + "T00:00:00").toLocaleDateString("it-IT")}`}
                      value={euro(rapportino.saldoOggi)}
                      mono accent
                    />
                  </div>
                  <div className="border-t border-border pt-2 mt-1 space-y-2">
                    <Row label="Carte" value={euro(rapportino.totCarte)} mono />
                    <Row label="Uber" value={euro(rapportino.totUber)} mono />
                    {rapportino.totNonInc > 0 && (
                      <Row label="Non incassato" value={euro(rapportino.totNonInc)} mono />
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Spese */}
            <section className="bg-card border border-border rounded-lg">
              <div className="border-b border-border px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Spese</p>
                <p className="font-mono text-xs font-medium text-foreground">{euro(rapportino.totSpese)}</p>
              </div>
              <div className="divide-y divide-border">
                {rapportino.spese.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Nessuna spesa.</p>
                )}
                {rapportino.spese.map(sp => (
                  <div key={sp.id} className="px-4 py-2.5 flex items-center justify-between gap-4">
                    <span className="text-sm">{sp.descrizione}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-medium">{euro(sp.importo)}</span>
                      <button
                        onClick={() => eliminaSpesa(sp.id)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Add spesa form */}
              <form onSubmit={aggiungiSpesa} className="px-4 py-3 border-t border-border flex gap-2">
                <input
                  type="text"
                  placeholder="Descrizione spesa"
                  value={nuovaSpesaDesc}
                  onChange={e => setNuovaSpesaDesc(e.target.value)}
                  className={cn(inputClass, "flex-1")}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="€"
                  value={nuovaSpesaImporto}
                  onChange={e => setNuovaSpesaImporto(e.target.value)}
                  className={cn(inputClass, "w-24 font-mono")}
                />
                <button
                  type="submit"
                  disabled={salvandoSpesa}
                  className="bg-primary text-primary-foreground text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 shrink-0"
                >
                  + Aggiungi
                </button>
              </form>
            </section>

            {/* Servizi */}
            <section className="bg-card border border-border rounded-lg">
              <div className="border-b border-border px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Dettaglio servizi ({rapportino.corse.length})
                </p>
              </div>
              {rapportino.corse.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Nessuna corsa registrata.</p>
              ) : (
                <div>
                  <div className="hidden sm:grid grid-cols-5 px-4 py-2 bg-muted/30 border-b border-border">
                    {["Ora", "Tipo", "Partenza", "Destinazione", "Importo"].map(h => (
                      <span key={h} className="text-xs font-medium text-muted-foreground uppercase tracking-wider last:text-right">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-border">
                    {rapportino.corse.map((c, i) => (
                      <div key={i} className="px-4 py-3 hidden sm:grid grid-cols-5 items-center gap-2">
                        <span className="font-mono text-xs">{c.ora_partenza.slice(0, 5)}</span>
                        <PagamentoBadge tipo={c.tipo_pagamento} />
                        <span className="text-sm truncate">{c.origine}</span>
                        <span className="text-sm truncate">{c.destinazione}</span>
                        <span className="font-mono text-sm text-right">{euro(c.importo)}</span>
                      </div>
                    ))}
                    {rapportino.corse.map((c, i) => (
                      <div key={`m-${i}`} className="sm:hidden px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{c.ora_partenza.slice(0, 5)}</span>
                            <PagamentoBadge tipo={c.tipo_pagamento} />
                          </div>
                          <p className="text-sm truncate">{c.origine} → {c.destinazione}</p>
                        </div>
                        <span className="font-mono text-sm font-medium shrink-0">{euro(c.importo)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-border bg-muted/20 hidden sm:grid grid-cols-5">
                    <span className="col-span-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Totali</span>
                    <span className="font-mono text-sm font-semibold text-right text-primary">{euro(rapportino.totCash + rapportino.totCarte + rapportino.totUber + rapportino.totNonInc)}</span>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(mono && "font-mono", "font-medium", accent && "text-primary")}>{value}</span>
    </div>
  );
}

const pagamentoBadgeStyle: Record<string, string> = {
  cash: "bg-amber-400/10 text-amber-400",
  carta: "bg-blue-400/10 text-blue-400",
  uber: "bg-muted text-muted-foreground",
  noninc: "bg-purple-400/10 text-purple-400",
};

const pagamentoLabel: Record<string, string> = {
  cash: "Cash", carta: "Carta", uber: "Uber", noninc: "No Inc",
};

function PagamentoBadge({ tipo }: { tipo: string }) {
  return (
    <span className={cn("text-xs px-1.5 py-0.5 rounded-lg font-medium", pagamentoBadgeStyle[tipo] ?? "bg-muted text-muted-foreground")}>
      {pagamentoLabel[tipo] ?? tipo}
    </span>
  );
}

const inputClass =
  "bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
