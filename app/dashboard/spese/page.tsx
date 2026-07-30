"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Receipt, Plus, Trash, CalendarBlank, Tag, PencilSimple } from "@phosphor-icons/react";

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
  const [mese, setMese] = useState("");

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
    if (!confirm("Eliminare questa spesa?")) return;
    const { error } = await supabase.from("spese").delete().eq("id", id);
    if (!error) setSpese(prev => prev.filter(s => s.id !== id));
  }

  const speseFiltrate = mese ? spese.filter(s => s.data.startsWith(mese)) : spese;
  const totMese = speseFiltrate.reduce((acc, s) => acc + s.importo, 0);
  const mesiDisponibili = [...new Set(spese.map(s => s.data.slice(0, 7)))].sort().reverse();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Spese</h1>
          <p className="text-xs text-on-surface-variant">Gestione uscite di cassa</p>
        </div>
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
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-6">
        {/* Summary */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-400/5 rounded-full blur-3xl" />
          <div>
            <div className="p-2.5 bg-rose-400/10 rounded-xl w-fit mb-3">
              <Receipt size={18} weight="fill" className="text-rose-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Totale spese</p>
            <p className="font-mono text-2xl font-bold text-rose-400">{euro(totMese)}</p>
          </div>
          <span className="text-sm text-on-surface-variant">{speseFiltrate.length} voci</span>
        </div>

        {/* Form aggiunta */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-4">
            <Plus size={12} weight="bold" />
            Nuova spesa
          </h2>
          <form onSubmit={aggiungi} className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-36">
              <CalendarBlank size={13} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative flex-1">
              <Tag size={13} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Descrizione"
                value={form.descrizione}
                onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                className="w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative w-full sm:w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50 pointer-events-none font-bold">€</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.importo}
                onChange={e => setForm(f => ({ ...f, importo: e.target.value }))}
                className="w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 pl-7 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center justify-center gap-1.5 bg-primary text-on-primary text-sm font-bold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 uppercase tracking-wide shadow-lg shadow-primary/20"
            >
              <Plus size={14} weight="bold" />
              {salvando ? "…" : "Aggiungi"}
            </button>
          </form>
          {errore && <p className="text-xs text-rose-400 mt-2">{errore}</p>}
        </div>

        {/* Lista spese */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-4 px-6 py-3 border-b border-border-subtle bg-surface-container-low/50">
            {["Data", "Descrizione", "Importo", ""].map((h, i) => (
              <span key={i} className={cn("text-[11px] font-bold uppercase tracking-wider text-on-secondary-container", h === "Importo" && "text-right", h === "" && "text-right")}>{h}</span>
            ))}
          </div>

          {caricamento && (
            <p className="px-6 py-8 text-sm text-on-surface-variant text-center">Caricamento…</p>
          )}

          {!caricamento && speseFiltrate.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Receipt size={32} weight="light" className="text-on-surface-variant mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">Nessuna spesa per questo periodo.</p>
            </div>
          )}

          <div className="divide-y divide-border-subtle">
            {speseFiltrate.map(s => (
              <div key={s.id}>
                <div className="hidden sm:grid grid-cols-4 px-6 py-4 hover:bg-surface-variant/20 transition-colors items-center">
                  <span className="text-sm text-on-surface-variant">
                    {new Date(s.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="text-sm text-foreground font-medium">{s.descrizione}</span>
                  <span className="font-mono text-sm text-destructive text-right font-bold">− {euro(s.importo)}</span>
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/dashboard/spese/${s.id}`}
                      className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                    >
                      <PencilSimple size={13} weight="bold" />
                      Modifica
                    </Link>
                    <button
                      onClick={() => elimina(s.id)}
                      className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-400/10"
                    >
                      <Trash size={13} weight="bold" />
                      Elimina
                    </button>
                  </div>
                </div>

                <div className="sm:hidden px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{s.descrizione}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(s.data + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm text-destructive font-bold">− {euro(s.importo)}</span>
                    <Link href={`/dashboard/spese/${s.id}`} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                      <PencilSimple size={15} weight="bold" />
                    </Link>
                    <button onClick={() => elimina(s.id)} className="text-on-surface-variant hover:text-rose-400 transition-colors p-1">
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
