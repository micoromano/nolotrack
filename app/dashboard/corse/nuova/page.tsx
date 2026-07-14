"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TipoPagamento } from "@/types";
import {
  CurrencyEur, CreditCard, Car, Tag, MapPin, CalendarBlank, ArrowLeft, CheckCircle,
  Path, Receipt, UserPlus, Buildings,
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
    iconInactive: "bg-surface-container-high text-on-surface-variant",
  },
  {
    value: "carta", label: "Carta", icon: CreditCard,
    active: "border-blue-400/60 bg-blue-400/10 text-blue-400",
    iconActive: "bg-blue-400/20 text-blue-400",
    iconInactive: "bg-surface-container-high text-on-surface-variant",
  },
  {
    value: "uber", label: "Uber", icon: Car,
    active: "border-slate-400/40 bg-slate-400/10 text-slate-300",
    iconActive: "bg-slate-400/20 text-slate-300",
    iconInactive: "bg-surface-container-high text-on-surface-variant",
  },
  {
    value: "noninc", label: "No Inc", icon: Tag,
    active: "border-purple-400/60 bg-purple-400/10 text-purple-400",
    iconActive: "bg-purple-400/20 text-purple-400",
    iconInactive: "bg-surface-container-high text-on-surface-variant",
  },
];

const pagamentoLabel: Record<TipoPagamento, string> = {
  cash: "Cash",
  carta: "Carta",
  uber: "Uber",
  noninc: "Non incassato",
};

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

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
    const importoFmt = formatEuro(parseFloat(importo) || 0);
    await sendPush({
      title: "Corsa salvata",
      body: `${origine} → ${destinazione} · ${importoFmt}`,
      url: "/dashboard/corse",
      tag: "corsa-salvata",
    });
    router.push("/dashboard/corse");
    router.refresh();
  }

  const pronta = Boolean(data && oraPartenza && origine && destinazione && parseFloat(importo) > 0);

  return (
    <div>
      {/* Header sticky */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-border-subtle text-on-surface-variant hover:text-foreground hover:bg-surface-container transition-colors shrink-0"
        >
          <ArrowLeft size={16} weight="bold" />
        </button>
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Nuova corsa</h1>
          <p className="text-xs text-on-surface-variant">Registra i dettagli della corsa</p>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto">
        <form onSubmit={salva} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonna sinistra: sezioni form */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Data & Orario */}
            <section className="glass-card p-6 rounded-2xl">
              <SectionTitle icon={CalendarBlank}>Data &amp; orario</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Data">
                  <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
                </Field>
                <Field label="Ora partenza">
                  <input type="time" value={oraPartenza} onChange={(e) => setOraPartenza(e.target.value)} required className={cn(inputClass, "font-mono")} />
                </Field>
                <Field label="Ora fine">
                  <input type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} className={cn(inputClass, "font-mono")} />
                </Field>
              </div>
            </section>

            {/* Percorso */}
            <section className="glass-card p-6 rounded-2xl">
              <SectionTitle icon={Path}>Percorso</SectionTitle>
              <div className="space-y-4">
                <Field label="Partenza">
                  <div className="relative">
                    <MapPin size={16} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10" />
                    <PlaceAutocomplete
                      value={origine}
                      onChange={setOrigine}
                      required
                      placeholder="es. Milano Centrale"
                      className={cn(inputClass, "pl-9")}
                    />
                  </div>
                </Field>
                <Field label="Destinazione">
                  <div className="relative">
                    <MapPin size={16} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none z-10" />
                    <PlaceAutocomplete
                      value={destinazione}
                      onChange={setDestinazione}
                      required
                      placeholder="es. Aeroporto Malpensa"
                      className={cn(inputClass, "pl-9")}
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* Servizio & Pagamento */}
            <section className="glass-card p-6 rounded-2xl">
              <SectionTitle icon={CurrencyEur}>Servizio &amp; pagamento</SectionTitle>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pagamento</label>
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
                            sel ? active : "border-border-subtle bg-surface-container-lowest text-on-surface-variant hover:border-primary/40"
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
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Importo">
                    <div className="relative">
                      <CurrencyEur size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none" />
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
            </section>

            {/* Cliente & Agenzia */}
            <section className="glass-card p-6 rounded-2xl">
              <SectionTitle icon={UserPlus}>Cliente &amp; agenzia</SectionTitle>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Agenzia" icon={Buildings}>
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
                <Field label="Note (opzionale)">
                  <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. cliente abituale…" className={inputClass} />
                </Field>
              </div>
            </section>
          </div>

          {/* Colonna destra: riepilogo + azioni */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 flex flex-col gap-6">
              <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                <h2 className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-5">
                  <Receipt size={16} weight="fill" className="text-success-emerald" />
                  Riepilogo corsa
                </h2>

                <div className="space-y-3 mb-6 relative">
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-on-surface-variant shrink-0">Tratta</span>
                    <span className="text-right text-foreground font-medium">
                      {origine || "—"} <span className="text-on-surface-variant">→</span> {destinazione || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Data &amp; ora</span>
                    <span className="font-mono text-foreground">
                      {data ? new Date(data + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—"}
                      {" · "}{oraPartenza || "—:--"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Pagamento</span>
                    <span className="text-foreground font-medium">{pagamentoLabel[tipoPagamento]}</span>
                  </div>

                  <div className="pt-4 border-t border-border-subtle flex justify-between items-center">
                    <span className="text-sm font-semibold text-on-surface">Importo</span>
                    <span className="font-mono text-3xl font-bold text-primary">
                      {formatEuro(parseFloat(importo) || 0)}
                    </span>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border mb-5 transition-colors",
                  pronta
                    ? "bg-success-emerald/5 border-success-emerald/20"
                    : "bg-surface-container-lowest border-border-subtle"
                )}>
                  <CheckCircle
                    size={18}
                    weight="fill"
                    className={pronta ? "text-success-emerald shrink-0" : "text-on-surface-variant/40 shrink-0"}
                  />
                  <p className={cn("text-xs", pronta ? "text-success-emerald" : "text-on-surface-variant")}>
                    {pronta ? "Corsa pronta per essere salvata." : "Completa data, tratta e importo per salvare."}
                  </p>
                </div>

                {errore && (
                  <p className="text-sm text-destructive flex items-center gap-2 mb-4">
                    <span className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-xs shrink-0">!</span>
                    {errore}
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={caricamento}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-3 rounded-lg transition-all hover:opacity-90 disabled:opacity-50 shadow-[0_4px_14px_rgba(59,130,246,0.2)]"
                  >
                    {caricamento ? (
                      "Salvataggio…"
                    ) : (
                      <>
                        <CheckCircle size={16} weight="fill" />
                        Salva corsa
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full bg-surface-container text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors hover:bg-surface-container-high"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={16} weight="fill" className="text-primary" />
      <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{children}</h2>
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
      <label className={cn("flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider")}>
        {Icon && <Icon size={11} weight="bold" className={iconClass} />}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
