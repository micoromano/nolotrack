"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TipoPagamento } from "@/types";
import {
  CurrencyEur, CreditCard, Car, Tag, MapPin, Clock, CalendarBlank, ArrowLeft, CheckCircle,
} from "@phosphor-icons/react";
import PlaceAutocomplete from "@/components/place-autocomplete";
import { sendPush } from "@/lib/push";

const pagamentoPills: {
  value: TipoPagamento;
  label: string;
  icon: React.ElementType;
  active: string;
  iconActive: string;
  iconInactive: string;
}[] = [
  {
    value: "cash", label: "Cash", icon: CurrencyEur,
    active: "border-amber-400/60 bg-amber-400/10 text-amber-400",
    iconActive: "bg-amber-400/20 text-amber-400",
    iconInactive: "bg-muted/40 text-muted-foreground",
  },
  {
    value: "carta", label: "Carta", icon: CreditCard,
    active: "border-blue-400/60 bg-blue-400/10 text-blue-400",
    iconActive: "bg-blue-400/20 text-blue-400",
    iconInactive: "bg-muted/40 text-muted-foreground",
  },
  {
    value: "uber", label: "Uber", icon: Car,
    active: "border-slate-400/40 bg-slate-400/10 text-slate-300",
    iconActive: "bg-slate-400/20 text-slate-300",
    iconInactive: "bg-muted/40 text-muted-foreground",
  },
  {
    value: "noninc", label: "No Inc", icon: Tag,
    active: "border-purple-400/60 bg-purple-400/10 text-purple-400",
    iconActive: "bg-purple-400/20 text-purple-400",
    iconInactive: "bg-muted/40 text-muted-foreground",
  },
];

export default function NuovaCorsaPage() {
  const oggi = new Date().toISOString().split("T")[0];
  const oraAdesso = new Date().toTimeString().slice(0, 5);

  const [data, setData] = useState(oggi);
  const [oraPartenza, setOraPartenza] = useState(oraAdesso);
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
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("corse").insert({
      autista_id: user!.id,
      data,
      ora_partenza: oraPartenza,
      origine,
      destinazione,
      tipo_pagamento: tipoPagamento,
      importo: parseFloat(importo) || 0,
      note: note || null,
      agenzia:       agenzia || null,
      rif_agenzia:   rifAgenzia || null,
      cliente_nome:  clienteNome || null,
      cliente_tel:   clienteTel || null,
      n_pax:         nPax,
      ora_fine:      oraFine || null,
      tipo_servizio: tipoServizio || null,
    });
    if (error) {
      setErrore("Errore: " + error.message);
      setCaricamento(false);
      return;
    }
    const importoFmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(parseFloat(importo) || 0);
    await sendPush({
      title: "Corsa salvata",
      body: `${origine} → ${destinazione} · ${importoFmt}`,
      url: "/dashboard/corse",
      tag: "corsa-salvata",
    });
    router.push("/dashboard/corse");
    router.refresh();
  }

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Indietro
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold text-foreground">Nuova corsa</h1>
      </div>

      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Inserisci i dettagli della corsa</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-5">

            {/* Data + Ora */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data" icon={CalendarBlank}>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
              </Field>
              <Field label="Ora partenza" icon={Clock}>
                <input type="time" value={oraPartenza} onChange={(e) => setOraPartenza(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
            </div>

            {/* Partenza */}
            <Field label="Partenza" icon={MapPin} iconClass="text-emerald-400">
              <div className="relative">
                <MapPin size={14} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10" />
                <PlaceAutocomplete
                  value={origine}
                  onChange={setOrigine}
                  required
                  placeholder="es. Milano Centrale"
                  className={cn(inputClass, "pl-8")}
                />
              </div>
            </Field>

            {/* Destinazione */}
            <Field label="Destinazione" icon={MapPin} iconClass="text-rose-400">
              <div className="relative">
                <MapPin size={14} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400/50 pointer-events-none z-10" />
                <PlaceAutocomplete
                  value={destinazione}
                  onChange={setDestinazione}
                  required
                  placeholder="es. Aeroporto Malpensa"
                  className={cn(inputClass, "pl-8")}
                />
              </div>
            </Field>

            {/* Tipo pagamento */}
            <Field label="Pagamento">
              <div className="grid grid-cols-4 gap-2">
                {pagamentoPills.map(({ value, label, icon: Icon, active, iconActive, iconInactive }) => {
                  const sel = tipoPagamento === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTipoPagamento(value)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-3 px-1 border rounded-xl transition-all",
                        sel ? active : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30"
                      )}
                    >
                      <span className={cn("flex items-center justify-center w-9 h-9 rounded-xl transition-all", sel ? iconActive : iconInactive)}>
                        <Icon size={18} weight={sel ? "fill" : "regular"} />
                      </span>
                      <span className="text-xs font-semibold leading-none">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Importo */}
            <Field label="Importo" icon={CurrencyEur}>
              <div className="relative">
                <CurrencyEur size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={importo}
                  onChange={(e) => setImporto(e.target.value)}
                  required
                  className={cn(inputClass, "pl-8 font-mono")}
                />
              </div>
            </Field>

            {/* Sezione dettaglio ordine */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dettaglio ordine
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Agenzia">
                  <input
                    type="text"
                    value={agenzia}
                    onChange={(e) => setAgenzia(e.target.value)}
                    placeholder="es. Tika"
                    className={inputClass}
                  />
                </Field>
                <Field label="Rif. agenzia">
                  <input
                    type="text"
                    value={rifAgenzia}
                    onChange={(e) => setRifAgenzia(e.target.value)}
                    placeholder="es. 329/2026"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Cliente">
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Nome passeggero"
                    className={inputClass}
                  />
                </Field>
                <Field label="Tel. cliente">
                  <input
                    type="tel"
                    value={clienteTel}
                    onChange={(e) => setClienteTel(e.target.value)}
                    placeholder="+39…"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Pax">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={nPax}
                    onChange={(e) => setNPax(parseInt(e.target.value) || 1)}
                    className={cn(inputClass, "font-mono")}
                  />
                </Field>
                <Field label="Ora fine">
                  <input
                    type="time"
                    value={oraFine}
                    onChange={(e) => setOraFine(e.target.value)}
                    className={cn(inputClass, "font-mono")}
                  />
                </Field>
                <Field label="Tipo servizio">
                  <input
                    type="text"
                    list="tipi-servizio"
                    value={tipoServizio}
                    onChange={(e) => setTipoServizio(e.target.value)}
                    placeholder="Transfer…"
                    className={inputClass}
                  />
                  <datalist id="tipi-servizio">
                    <option value="Transfer FCO" />
                    <option value="Transfer CIA" />
                    <option value="Transfer stazione" />
                    <option value="Transfer indirizzo" />
                    <option value="Escursione" />
                    <option value="Full day" />
                  </datalist>
                </Field>
              </div>
            </div>

            {/* Note */}
            <Field label="Note (opzionale)">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. cliente abituale…" className={inputClass} />
            </Field>

            {errore && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-xs">!</span>
                {errore}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={caricamento}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              >
                {caricamento ? (
                  "Salvataggio…"
                ) : (
                  <>
                    <CheckCircle size={15} weight="fill" />
                    Salva corsa
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors hover:bg-muted/70"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, iconClass, children }: {
  label: string;
  icon?: React.ElementType;
  iconClass?: string;
  children: React.ReactNode;
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

const inputClass =
  "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
