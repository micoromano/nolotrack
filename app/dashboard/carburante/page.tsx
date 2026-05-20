"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CarburantePDFButton = dynamic(() => import("./pdf-button"), { ssr: false });
import { cn } from "@/lib/utils";
import {
  GasPump,
  CurrencyEur,
  ChartLineUp,
  Car,
  Trash,
  Plus,
  CalendarBlank,
  CaretDown,
  CaretUp,
  PencilSimple,
} from "@phosphor-icons/react";

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function litri(n: number) {
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(n) + " L";
}

interface Rifornimento {
  id: string;
  data: string;
  targa: string;
  km: number | null;
  litri: number;
  prezzo_litro: number | null;
  importo: number;
}

interface Targa {
  id: string;
  targa: string;
}

export default function CarburantePage() {
  const [rifornimenti, setRifornimenti] = useState<Rifornimento[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [mese, setMese] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Targhe
  const [targhe, setTarghe] = useState<Targa[]>([]);
  const [nuovaTarga, setNuovaTarga] = useState("");
  const [pannelloTarghe, setPannelloTarghe] = useState(false);
  const [salvandoTarga, setSalvandoTarga] = useState(false);

  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    targa: "",
    km: "",
    litri: "",
    prezzo_litro: "",
    importo: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const supabase = createClient();

  const caricaTarghe = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("targhe")
      .select("id, targa")
      .eq("autista_id", userId)
      .order("created_at");
    const lista = data ?? [];
    setTarghe(lista);
    if (lista.length > 0) {
      setForm(f => f.targa ? f : { ...f, targa: lista[0].targa });
    }
  }, [supabase]);

  const carica = useCallback(async () => {
    setCaricamento(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data }, ] = await Promise.all([
      supabase.from("carburante").select("id, data, targa, km, litri, prezzo_litro, importo")
        .eq("autista_id", user.id).order("data", { ascending: false }).order("created_at", { ascending: false }),
      caricaTarghe(user.id),
    ]);
    setRifornimenti(data ?? []);
    setCaricamento(false);
  }, [supabase, caricaTarghe]);

  useEffect(() => { carica(); }, [carica]);

  // Auto-calcolo importo quando cambiano litri o prezzo_litro
  function handleLitriChange(val: string) {
    const litriNum = parseFloat(val.replace(",", "."));
    const prezzoNum = parseFloat(form.prezzo_litro.replace(",", "."));
    let newImporto = form.importo;
    if (!isNaN(litriNum) && !isNaN(prezzoNum) && litriNum > 0 && prezzoNum > 0) {
      newImporto = (litriNum * prezzoNum).toFixed(2);
    }
    setForm(f => ({ ...f, litri: val, importo: newImporto }));
  }

  function handlePrezzoChange(val: string) {
    const litriNum = parseFloat(form.litri.replace(",", "."));
    const prezzoNum = parseFloat(val.replace(",", "."));
    let newImporto = form.importo;
    if (!isNaN(litriNum) && !isNaN(prezzoNum) && litriNum > 0 && prezzoNum > 0) {
      newImporto = (litriNum * prezzoNum).toFixed(2);
    }
    setForm(f => ({ ...f, prezzo_litro: val, importo: newImporto }));
  }

  async function aggiungi(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);

    const litriNum = parseFloat(form.litri.replace(",", "."));
    const importoNum = parseFloat(form.importo.replace(",", "."));

    if (!form.data || !form.targa || isNaN(litriNum) || litriNum <= 0 || isNaN(importoNum) || importoNum <= 0) {
      setErrore("Compila almeno data, targa, litri e importo.");
      return;
    }

    const kmNum = form.km.trim() ? parseFloat(form.km.replace(",", ".")) : null;
    const prezzoNum = form.prezzo_litro.trim() ? parseFloat(form.prezzo_litro.replace(",", ".")) : null;

    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("carburante").insert({
      autista_id: user.id,
      data: form.data,
      targa: form.targa,
      km: kmNum,
      litri: litriNum,
      prezzo_litro: prezzoNum,
      importo: importoNum,
    });

    if (error) {
      setErrore(error.message);
    } else {
      setForm(f => ({ data: new Date().toISOString().slice(0, 10), targa: f.targa, km: "", litri: "", prezzo_litro: "", importo: "" }));
      await carica();
    }
    setSalvando(false);
  }

  async function aggiungiTarga(e: React.FormEvent) {
    e.preventDefault();
    const t = nuovaTarga.trim().toUpperCase();
    if (!t) return;
    setSalvandoTarga(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("targhe").insert({ autista_id: user.id, targa: t });
    if (!error) {
      setNuovaTarga("");
      await caricaTarghe(user.id);
      setForm(f => ({ ...f, targa: f.targa || t }));
    }
    setSalvandoTarga(false);
  }

  async function eliminaTarga(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("targhe").delete().eq("id", id);
    await caricaTarghe(user.id);
  }

  async function elimina(id: string) {
    if (!confirm("Eliminare questo rifornimento?")) return;
    const { error } = await supabase.from("carburante").delete().eq("id", id);
    if (!error) setRifornimenti(prev => prev.filter(r => r.id !== id));
  }

  // Dati filtrati per mese
  const rifFiltrati = mese
    ? rifornimenti.filter(r => r.data.startsWith(mese))
    : rifornimenti;

  // Metriche mese
  const totLitri = rifFiltrati.reduce((acc, r) => acc + r.litri, 0);
  const totSpesa = rifFiltrati.reduce((acc, r) => acc + r.importo, 0);
  const kmValidi = rifFiltrati.filter(r => r.km !== null && r.km !== undefined);
  const totKm = kmValidi.length > 0
    ? kmValidi.reduce((acc, r) => acc + (r.km ?? 0), 0)
    : null;
  const mediaPrezzo = rifFiltrati.length > 0 && totLitri > 0
    ? totSpesa / totLitri
    : null;

  // Selettore mesi disponibili
  const mesiDisponibili = [...new Set(rifornimenti.map(r => r.data.slice(0, 7)))].sort().reverse();

  const labelMese = (m: string) => {
    const [anno, mes] = m.split("-");
    return new Date(+anno, +mes - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  };

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Carburante</h1>
          <p className="text-xs text-muted-foreground">Registro rifornimenti</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPannelloTarghe(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors"
          >
            <Car size={13} weight="bold" />
            Targhe
            {pannelloTarghe ? <CaretUp size={11} /> : <CaretDown size={11} />}
          </button>
          <select
            value={mese}
            onChange={e => setMese(e.target.value)}
            className="bg-background border border-border text-sm text-foreground px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Tutti i periodi</option>
            {mesiDisponibili.map(m => (
              <option key={m} value={m}>{labelMese(m)}</option>
            ))}
          </select>
          <CarburantePDFButton mese={mese} />
        </div>
      </div>

      {/* Pannello gestione targhe */}
      {pannelloTarghe && (
        <div className="border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {targhe.length === 0 && (
              <span className="text-xs text-muted-foreground">Nessuna targa registrata.</span>
            )}
            {targhe.map(t => (
              <div key={t.id} className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
                <Car size={12} weight="bold" className="text-orange-400" />
                <span className="text-sm font-mono font-semibold">{t.targa}</span>
                <button
                  onClick={() => eliminaTarga(t.id)}
                  className="text-muted-foreground hover:text-rose-400 transition-colors ml-1"
                >
                  <Trash size={12} weight="bold" />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={aggiungiTarga} className="flex items-center gap-2">
            <input
              type="text"
              value={nuovaTarga}
              onChange={e => setNuovaTarga(e.target.value.toUpperCase())}
              placeholder="es. AB123CD"
              maxLength={10}
              className="bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 font-mono px-3 py-2 rounded-lg w-36 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
            />
            <button
              type="submit"
              disabled={salvandoTarga || !nuovaTarga.trim()}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus size={12} weight="bold" />
              Aggiungi targa
            </button>
          </form>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* 4 tile metriche */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Totale litri */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-400/15 text-emerald-400">
              <GasPump size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Litri mese</p>
            <p className="font-mono text-xl font-semibold mt-1 text-emerald-400">
              {rifFiltrati.length > 0 ? litri(totLitri) : "—"}
            </p>
          </div>

          {/* Totale spesa */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-amber-400/15 text-amber-400">
              <CurrencyEur size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Spesa mese</p>
            <p className="font-mono text-xl font-semibold mt-1 text-amber-400">
              {rifFiltrati.length > 0 ? euro(totSpesa) : "—"}
            </p>
          </div>

          {/* Media €/L */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-sky-400/15 text-sky-400">
              <ChartLineUp size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Media €/L</p>
            <p className="font-mono text-xl font-semibold mt-1 text-sky-400">
              {mediaPrezzo !== null
                ? new Intl.NumberFormat("it-IT", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(mediaPrezzo)
                : "—"}
            </p>
          </div>

          {/* Km registrati */}
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center bg-violet-400/15 text-violet-400">
              <Car size={18} weight="fill" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 pr-10">Km mese</p>
            <p className="font-mono text-xl font-semibold mt-1 text-violet-400">
              {totKm !== null
                ? new Intl.NumberFormat("it-IT").format(totKm)
                : "—"}
            </p>
          </div>
        </div>

        {/* Form aggiunta rifornimento */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            <Plus size={12} weight="bold" />
            Nuovo rifornimento
          </h2>
          <form onSubmit={aggiungi} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Data */}
              <div className="relative col-span-2 sm:col-span-1">
                <CalendarBlank size={13} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                <input
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full bg-background border border-border text-sm text-foreground pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Targa */}
              <div className="relative">
                <Car size={13} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10" />
                {targhe.length > 0 ? (
                  <select
                    value={form.targa}
                    onChange={e => setForm(f => ({ ...f, targa: e.target.value }))}
                    className="w-full bg-background border border-border text-sm text-foreground pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none font-mono"
                  >
                    {targhe.map(t => (
                      <option key={t.id} value={t.targa}>{t.targa}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.targa}
                    onChange={e => setForm(f => ({ ...f, targa: e.target.value.toUpperCase() }))}
                    placeholder="Targa"
                    className="w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono uppercase"
                  />
                )}
              </div>

              {/* Km (opzionale) */}
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Km (es. 45230)"
                  value={form.km}
                  onChange={e => setForm(f => ({ ...f, km: e.target.value }))}
                  className="w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                />
              </div>

              {/* Litri */}
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  placeholder="Litri"
                  value={form.litri}
                  onChange={e => handleLitriChange(e.target.value)}
                  className="w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                />
              </div>

              {/* €/L */}
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  placeholder="€/L (es. 1.759)"
                  value={form.prezzo_litro}
                  onChange={e => handlePrezzoChange(e.target.value)}
                  className="w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                />
              </div>

              {/* Importo */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50 pointer-events-none font-bold">€</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0,00"
                  value={form.importo}
                  onChange={e => setForm(f => ({ ...f, importo: e.target.value }))}
                  className="w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 pl-7 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
              >
                <Plus size={14} weight="bold" />
                {salvando ? "…" : "Aggiungi"}
              </button>
              {errore && <p className="text-xs text-rose-400">{errore}</p>}
            </div>
          </form>
        </div>

        {/* Tabella lista rifornimenti */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Header desktop */}
          <div className="hidden sm:grid grid-cols-7 px-4 py-2 border-b border-border bg-muted/30">
            {["Data", "Targa", "Km", "Litri", "€/L", "Importo", ""].map((h, i) => (
              <span
                key={i}
                className={cn(
                  "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                  (h === "Importo" || h === "") && "text-right"
                )}
              >
                {h}
              </span>
            ))}
          </div>

          {caricamento && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Caricamento…</p>
          )}

          {!caricamento && rifFiltrati.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nessun rifornimento per questo periodo.</p>
          )}

          <div className="divide-y divide-border">
            {rifFiltrati.map(r => (
              <div key={r.id}>
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-7 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="text-sm font-mono font-medium text-foreground">{r.targa}</span>
                  <span className={cn("font-mono text-sm", r.km !== null ? "text-foreground" : "text-muted-foreground/40")}>
                    {r.km !== null ? new Intl.NumberFormat("it-IT").format(r.km) : "—"}
                  </span>
                  <span className="font-mono text-sm text-emerald-400">
                    {new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(r.litri)}
                  </span>
                  <span className={cn("font-mono text-sm", r.prezzo_litro !== null ? "text-sky-400" : "text-muted-foreground/40")}>
                    {r.prezzo_litro !== null
                      ? new Intl.NumberFormat("it-IT", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(r.prezzo_litro)
                      : "—"}
                  </span>
                  <span className="font-mono text-sm text-amber-400 text-right">{euro(r.importo)}</span>
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/dashboard/carburante/${r.id}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                    >
                      <PencilSimple size={13} weight="bold" />
                      Modifica
                    </Link>
                    <button
                      onClick={() => elimina(r.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-400/10"
                    >
                      <Trash size={13} weight="bold" />
                      Elimina
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="sm:hidden px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-mono font-semibold text-foreground">{r.targa}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(r.data + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/carburante/${r.id}`} className="text-muted-foreground hover:text-primary transition-colors p-1">
                        <PencilSimple size={15} weight="bold" />
                      </Link>
                      <button
                        onClick={() => elimina(r.id)}
                        className="text-muted-foreground hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                    <span className="text-emerald-400">
                      {new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(r.litri)} L
                    </span>
                    {r.prezzo_litro !== null && (
                      <span className="text-sky-400">
                        {new Intl.NumberFormat("it-IT", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(r.prezzo_litro)} €/L
                      </span>
                    )}
                    <span className="text-amber-400 font-semibold">{euro(r.importo)}</span>
                    {r.km !== null && (
                      <span className="text-muted-foreground">
                        {new Intl.NumberFormat("it-IT").format(r.km)} km
                      </span>
                    )}
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
