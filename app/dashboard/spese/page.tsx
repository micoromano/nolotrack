"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Receipt, Plus, Trash, CalendarBlank, Tag } from "@phosphor-icons/react";

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

interface Spesa {
  id: string;
  data: string;
  descrizione: string;
  importo: number;
}

export default function SpesePage() {
  const [spese, setSpese] = useState<Spesa[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [mese, setMese] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    descrizione: "",
    importo: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const supabase = createClient();

  async function carica() {
    setCaricamento(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("spese")
      .select("id, data, descrizione, importo")
      .eq("autista_id", user.id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });
    setSpese(data ?? []);
    setCaricamento(false);
  }

  useEffect(() => { carica(); }, []);

  async function aggiungi(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    const importoNum = parseFloat(form.importo.replace(",", "."));
    if (!form.data || !form.descrizione.trim() || isNaN(importoNum) || importoNum <= 0) {
      setErrore("Compila tutti i campi correttamente.");
      return;
    }
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("spese").insert({
      autista_id: user.id,
      data: form.data,
      descrizione: form.descrizione.trim(),
      importo: importoNum,
    });
    if (error) {
      setErrore(error.message);
    } else {
      setForm({ data: new Date().toISOString().slice(0, 10), descrizione: "", importo: "" });
      await carica();
    }
    setSalvando(false);
  }

  async function elimina(id: string) {
    const { error } = await supabase.from("spese").delete().eq("id", id);
    if (!error) setSpese(prev => prev.filter(s => s.id !== id));
  }

  const speseFiltrate = mese ? spese.filter(s => s.data.startsWith(mese)) : spese;
  const totMese = speseFiltrate.reduce((acc, s) => acc + s.importo, 0);
  const mesiDisponibili = [...new Set(spese.map(s => s.data.slice(0, 7)))].sort().reverse();

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Spese</h1>
          <p className="text-xs text-muted-foreground">Gestione uscite di cassa</p>
        </div>
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
      </div>

      <div className="p-6 space-y-5">
        {/* Totale mese */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-rose-400/15 text-rose-400">
            <Receipt size={18} weight="fill" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Totale spese</p>
            <p className="font-mono text-2xl font-semibold text-rose-400">{euro(totMese)}</p>
          </div>
          <span className="text-xs text-muted-foreground pr-12">{speseFiltrate.length} voci</span>
        </div>

        {/* Form aggiunta */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <Plus size={12} weight="bold" />
            Nuova spesa
          </h2>
          <form onSubmit={aggiungi} className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-36">
              <CalendarBlank size={13} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full bg-background border border-border text-sm text-foreground pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative flex-1">
              <Tag size={13} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Descrizione"
                value={form.descrizione}
                onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                className="w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative w-full sm:w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 pointer-events-none font-bold">€</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.importo}
                onChange={e => setForm(f => ({ ...f, importo: e.target.value }))}
                className="w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 pl-7 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              <Plus size={14} weight="bold" />
              {salvando ? "…" : "Aggiungi"}
            </button>
          </form>
          {errore && <p className="text-xs text-rose-400 mt-2">{errore}</p>}
        </div>

        {/* Lista spese */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="hidden sm:grid grid-cols-4 px-4 py-2 border-b border-border bg-muted/30">
            {["Data", "Descrizione", "Importo", ""].map(h => (
              <span key={h} className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wider", h === "Importo" && "text-right", h === "" && "text-right")}>{h}</span>
            ))}
          </div>

          {caricamento && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Caricamento…</p>
          )}

          {!caricamento && speseFiltrate.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nessuna spesa per questo periodo.</p>
          )}

          <div className="divide-y divide-border">
            {speseFiltrate.map(s => (
              <div key={s.id}>
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-4 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                  <span className="text-sm text-muted-foreground">
                    {new Date(s.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="text-sm text-foreground">{s.descrizione}</span>
                  <span className="font-mono text-sm text-destructive text-right">− {euro(s.importo)}</span>
                  <div className="flex justify-end">
                    <button
                      onClick={() => elimina(s.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-400/10"
                    >
                      <Trash size={13} weight="bold" />
                      Elimina
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{s.descrizione}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(s.data + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm text-destructive">− {euro(s.importo)}</span>
                    <button
                      onClick={() => elimina(s.id)}
                      className="text-muted-foreground hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
