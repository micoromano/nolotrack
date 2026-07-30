"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TipoPagamento } from "@/types";
import {
  CurrencyEur, CreditCard, Car, Tag, MapPin, Clock,
  CalendarBlank, ArrowLeft, CheckCircle, Trash,
} from "@phosphor-icons/react";
import PlaceAutocomplete from "@/components/place-autocomplete";

const pagamentoPills: {
  value: TipoPagamento; label: string; icon: React.ElementType;
  active: string; iconActive: string; iconInactive: string;
}[] = [
  { value: "cash",   label: "Cash",   icon: CurrencyEur, active: "border-amber-400/60 bg-amber-400/10 text-amber-400",   iconActive: "bg-amber-400/20 text-amber-400",   iconInactive: "bg-muted/40 text-muted-foreground" },
  { value: "carta",  label: "Carta",  icon: CreditCard,  active: "border-blue-400/60 bg-blue-400/10 text-blue-400",     iconActive: "bg-blue-400/20 text-blue-400",     iconInactive: "bg-muted/40 text-muted-foreground" },
  { value: "uber",   label: "Uber",   icon: Car,         active: "border-slate-400/40 bg-slate-400/10 text-slate-300",  iconActive: "bg-slate-400/20 text-slate-300",   iconInactive: "bg-muted/40 text-muted-foreground" },
  { value: "noninc", label: "No Inc", icon: Tag,         active: "border-purple-400/60 bg-purple-400/10 text-purple-400", iconActive: "bg-purple-400/20 text-purple-400", iconInactive: "bg-muted/40 text-muted-foreground" },
];

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function EditaCorsaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");

  const [data, setData] = useState("");
  const [oraPartenza, setOraPartenza] = useState("");
  const [origine, setOrigine] = useState("");
  const [destinazione, setDestinazione] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>("cash");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");
  const [agenzia, setAgenzia] = useState("");
  const [rifAgenzia, setRifAgenzia] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTel, setClienteTel] = useState("");
  const [nPax, setNPax] = useState(1);
  const [oraFine, setOraFine] = useState("");
  const [tipoServizio, setTipoServizio] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: corsa, error } = await supabase
        .from("corse")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !corsa) { router.push("/dashboard/corse"); return; }
      setData(corsa.data);
      setOraPartenza(corsa.ora_partenza.slice(0, 5));
      setOrigine(corsa.origine);
      setDestinazione(corsa.destinazione);
      setTipoPagamento(corsa.tipo_pagamento);
      setImporto(String(corsa.importo));
      setNote(corsa.note ?? "");
      setAgenzia(corsa.agenzia ?? "");
      setRifAgenzia(corsa.rif_agenzia ?? "");
      setClienteNome(corsa.cliente_nome ?? "");
      setClienteTel(corsa.cliente_tel ?? "");
      setNPax(corsa.n_pax ?? 1);
      setOraFine(corsa.ora_fine?.slice(0, 5) ?? "");
      setTipoServizio(corsa.tipo_servizio ?? "");
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setSaving(true);
    const { error } = await supabase.from("corse").update({
      data,
      ora_partenza: oraPartenza,
      origine,
      destinazione,
      tipo_pagamento: tipoPagamento,
      importo: parseFloat(importo) || 0,
      note: note || null,
      agenzia: agenzia || null,
      rif_agenzia: rifAgenzia || null,
      cliente_nome: clienteNome || null,
      cliente_tel: clienteTel || null,
      n_pax: nPax,
      ora_fine: oraFine || null,
      tipo_servizio: tipoServizio || null,
    }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/corse");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questa corsa? L'azione è irreversibile.")) return;
    setDeleting(true);
    await supabase.from("corse").delete().eq("id", id);
    router.push("/dashboard/corse");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>
    );
  }

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Corse
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold text-foreground">Modifica corsa</h1>
      </div>

      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Modifica i dettagli della corsa</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-5">

            <div className="grid grid-cols-2 gap-3">
              <Field label="Data" icon={CalendarBlank}>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
              </Field>
              <Field label="Ora partenza" icon={Clock}>
                <input type="time" value={oraPartenza} onChange={(e) => setOraPartenza(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
            </div>

            <Field label="Partenza" icon={MapPin} iconClass="text-emerald-400">
              <div className="relative">
                <MapPin size={14} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10" />
                <PlaceAutocomplete value={origine} onChange={setOrigine} required placeholder="es. Milano Centrale" className={cn(inputClass, "pl-8")} />
              </div>
            </Field>

            <Field label="Destinazione" icon={MapPin} iconClass="text-rose-400">
              <div className="relative">
                <MapPin size={14} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400/50 pointer-events-none z-10" />
                <PlaceAutocomplete value={destinazione} onChange={setDestinazione} required placeholder="es. Aeroporto Fiumicino" className={cn(inputClass, "pl-8")} />
              </div>
            </Field>

            <Field label="Pagamento">
              <div className="grid grid-cols-4 gap-2">
                {pagamentoPills.map(({ value, label, icon: Icon, active, iconActive, iconInactive }) => {
                  const sel = tipoPagamento === value;
                  return (
                    <button key={value} type="button" onClick={() => setTipoPagamento(value)}
                      className={cn("flex flex-col items-center gap-2 py-3 px-1 border rounded-xl transition-all",
                        sel ? active : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30")}>
                      <span className={cn("flex items-center justify-center w-9 h-9 rounded-xl transition-all", sel ? iconActive : iconInactive)}>
                        <Icon size={18} weight={sel ? "fill" : "regular"} />
                      </span>
                      <span className="text-xs font-semibold leading-none">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Importo" icon={CurrencyEur}>
              <div className="relative">
                <CurrencyEur size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                <input type="number" min="0" step="0.01" placeholder="0.00" value={importo}
                  onChange={(e) => setImporto(e.target.value)} required className={cn(inputClass, "pl-8 font-mono")} />
              </div>
            </Field>

            <Field label="Note (opzionale)">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. cliente abituale…" className={inputClass} />
            </Field>

            {/* Dettaglio ordine */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dettaglio ordine</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Agenzia">
                  <input type="text" value={agenzia} onChange={(e) => setAgenzia(e.target.value)} placeholder="es. Tika" className={inputClass} />
                </Field>
                <Field label="Rif. agenzia">
                  <input type="text" value={rifAgenzia} onChange={(e) => setRifAgenzia(e.target.value)} placeholder="es. 329/2026" className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cliente">
                  <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome passeggero" className={inputClass} />
                </Field>
                <Field label="Tel. cliente">
                  <input type="tel" value={clienteTel} onChange={(e) => setClienteTel(e.target.value)} placeholder="+39…" className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Pax">
                  <input type="number" min="1" max="99" value={nPax} onChange={(e) => setNPax(parseInt(e.target.value) || 1)} className={cn(inputClass, "font-mono")} />
                </Field>
                <Field label="Ora fine">
                  <input type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} className={cn(inputClass, "font-mono")} />
                </Field>
                <Field label="Tipo servizio">
                  <input type="text" list="tipi-servizio-edit" value={tipoServizio} onChange={(e) => setTipoServizio(e.target.value)} placeholder="Transfer…" className={inputClass} />
                  <datalist id="tipi-servizio-edit">
                    <option value="Transfer FCO" /><option value="Transfer CIA" />
                    <option value="Transfer stazione" /><option value="Transfer indirizzo" />
                    <option value="Escursione" /><option value="Full day" />
                  </datalist>
                </Field>
              </div>
            </div>

            {errore && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-xs">!</span>
                {errore}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50">
                <CheckCircle size={15} weight="fill" />
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
              <button type="button" onClick={() => router.back()}
                className="bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors hover:bg-muted/70">
                Annulla
              </button>
              <button type="button" onClick={elimina} disabled={deleting}
                className="ml-auto flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50">
                <Trash size={14} weight="bold" />
                {deleting ? "Eliminando…" : "Elimina"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, iconClass, children }: {
  label: string; icon?: React.ElementType; iconClass?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={cn("flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider")}>
        {Icon && <Icon size={11} weight="bold" className={iconClass} />}
        {label}
      </label>
      {children}
    </div>
  );
}
