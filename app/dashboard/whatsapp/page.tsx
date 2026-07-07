"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { WhatsappTemplate, WhatsappLog, StatoServizio, DestinatarioTipoWA } from "@/types";
import {
  WhatsappLogo,
  Copy,
  CheckCircle,
  Warning,
  PaperPlaneTilt,
  Play,
  FlagCheckered,
  Gear,
  ClockCounterClockwise,
  CaretDown,
  CaretUp,
  Users,
} from "@phosphor-icons/react";

// ─────────────────────────────────────────────────────
// Tipi
// ─────────────────────────────────────────────────────
interface CorsaLite {
  id: string;
  data: string;
  ora_partenza: string;
  origine: string;
  destinazione: string;
  cliente_nome: string | null;
  cliente_tel: string | null;
  stato_servizio: StatoServizio;
}

interface ConfigStato {
  configurato: boolean;
  firmaVerificabile: boolean;
  callbackUrl: string;
}

const STATO_LABEL: Record<StatoServizio, string> = {
  da_iniziare: "Da iniziare",
  in_corso: "In corso",
  attesa_pagamento: "Attesa pagamento",
  pagato: "Pagato",
  completato: "Completato",
};

const STATO_STYLE: Record<StatoServizio, string> = {
  da_iniziare: "bg-slate-400/10 text-slate-400 border border-slate-400/20",
  in_corso: "bg-sky-400/10 text-sky-400 border border-sky-400/20",
  attesa_pagamento: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  pagato: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20",
  completato: "bg-violet-400/10 text-violet-400 border border-violet-400/20",
};

const inputClass =
  "w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

const REGEX_PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
function estraiPlaceholder(corpo: string): string[] {
  const trovati = new Set<string>();
  for (const m of corpo.matchAll(REGEX_PLACEHOLDER)) trovati.add(m[1]);
  return Array.from(trovati);
}
function riempiPlaceholder(corpo: string, valori: Record<string, string>): string {
  return corpo.replace(REGEX_PLACEHOLDER, (_m, chiave) => valori[chiave] ?? "");
}

// ─────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────
export default function WhatsappPage() {
  const supabase = createClient();

  const [config, setConfig] = useState<ConfigStato | null>(null);
  const [copiato, setCopiato] = useState(false);
  const [istruzioniAperte, setIstruzioniAperte] = useState(false);

  const [corse, setCorse] = useState<CorsaLite[]>([]);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [log, setLog] = useState<WhatsappLog[]>([]);
  const [caricamento, setCaricamento] = useState(true);

  // Flusso autista
  const [corsaFlussoId, setCorsaFlussoId] = useState("");
  const [telefonoAutista, setTelefonoAutista] = useState("");
  const [avvioStato, setAvvioStato] = useState<"idle" | "caricamento" | "ok" | "errore">("idle");
  const [avvioErrore, setAvvioErrore] = useState("");

  // Messaggio a cliente
  const [corsaClienteId, setCorsaClienteId] = useState("");
  const [modoCliente, setModoCliente] = useState<"template" | "libero">("libero");
  const [templateClienteId, setTemplateClienteId] = useState("");
  const [valoriClientePlaceholder, setValoriClientePlaceholder] = useState<Record<string, string>>({});
  const [testoCliente, setTestoCliente] = useState("");
  const [clienteStato, setClienteStato] = useState<"idle" | "caricamento" | "ok" | "errore">("idle");
  const [clienteErrore, setClienteErrore] = useState("");

  // Messaggio libero (a chiunque)
  const [telefonoLibero, setTelefonoLibero] = useState("");
  const [templateLiberoId, setTemplateLiberoId] = useState("");
  const [valoriLiberoPlaceholder, setValoriLiberoPlaceholder] = useState<Record<string, string>>({});
  const [testoLibero, setTestoLibero] = useState("");
  const [liberoStato, setLiberoStato] = useState<"idle" | "caricamento" | "ok" | "errore">("idle");
  const [liberoErrore, setLiberoErrore] = useState("");

  const carica = useCallback(async () => {
    setCaricamento(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [corseRes, autistaRes, templatesRes, logRes, statusRes] = await Promise.allSettled([
      supabase
        .from("corse")
        .select("id, data, ora_partenza, origine, destinazione, cliente_nome, cliente_tel, stato_servizio")
        .eq("autista_id", user.id)
        .order("data", { ascending: false })
        .order("ora_partenza", { ascending: false })
        .limit(30),
      supabase.from("autisti").select("telefono").eq("id", user.id).maybeSingle(),
      fetch("/api/whatsapp/templates").then((r) => r.json()),
      supabase
        .from("whatsapp_log")
        .select("*")
        .eq("autista_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      fetch("/api/whatsapp/status").then((r) => r.json()),
    ]);

    setCorse(corseRes.status === "fulfilled" ? corseRes.value.data ?? [] : []);
    if (autistaRes.status === "fulfilled" && autistaRes.value.data?.telefono) {
      setTelefonoAutista(autistaRes.value.data.telefono);
    }
    setTemplates(templatesRes.status === "fulfilled" ? templatesRes.value.templates ?? [] : []);
    setLog(logRes.status === "fulfilled" ? logRes.value.data ?? [] : []);
    if (statusRes.status === "fulfilled" && !statusRes.value.error) setConfig(statusRes.value);

    setCaricamento(false);
  }, [supabase]);

  useEffect(() => { carica(); }, [carica]);

  function copiaCallback() {
    if (!config) return;
    navigator.clipboard.writeText(config.callbackUrl);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2000);
  }

  async function avviaFlusso(e: React.FormEvent) {
    e.preventDefault();
    if (!corsaFlussoId || !telefonoAutista) return;
    setAvvioStato("caricamento");
    setAvvioErrore("");
    const res = await fetch("/api/whatsapp/invia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ azione: "avvia_flusso_autista", corsaId: corsaFlussoId, telefono: telefonoAutista }),
    });
    const json = await res.json();
    if (res.ok) {
      setAvvioStato("ok");
      setTimeout(() => setAvvioStato("idle"), 3000);
      await carica();
    } else {
      setAvvioStato("errore");
      setAvvioErrore(json.error ?? "Errore sconosciuto");
    }
  }

  const corsaCliente = corse.find((c) => c.id === corsaClienteId);
  const templateCliente = templates.find((t) => t.id === templateClienteId);
  const placeholderCliente = templateCliente ? estraiPlaceholder(templateCliente.corpo) : [];

  async function inviaMessaggioCliente(e: React.FormEvent) {
    e.preventDefault();
    const telefono = corsaCliente?.cliente_tel;
    if (!telefono) {
      setClienteErrore("Seleziona una corsa con numero di telefono cliente registrato.");
      setClienteStato("errore");
      return;
    }
    setClienteStato("caricamento");
    setClienteErrore("");

    const destinatarioTipo: DestinatarioTipoWA = "cliente";
    const body =
      modoCliente === "template" && templateCliente
        ? { azione: "usa_template", templateId: templateCliente.id, telefono, valori: valoriClientePlaceholder, destinatarioTipo, corsaId: corsaClienteId }
        : { azione: "messaggio_libero", telefono, testo: testoCliente, destinatarioTipo, corsaId: corsaClienteId };

    const res = await fetch("/api/whatsapp/invia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.ok) {
      setClienteStato("ok");
      setTestoCliente("");
      setTimeout(() => setClienteStato("idle"), 3000);
      await carica();
    } else {
      setClienteStato("errore");
      setClienteErrore(json.error ?? "Errore sconosciuto");
    }
  }

  const templateLibero = templates.find((t) => t.id === templateLiberoId);
  const placeholderLibero = templateLibero ? estraiPlaceholder(templateLibero.corpo) : [];

  async function inviaMessaggioLibero(e: React.FormEvent) {
    e.preventDefault();
    if (!telefonoLibero) return;
    setLiberoStato("caricamento");
    setLiberoErrore("");

    const body = templateLibero
      ? { azione: "usa_template", templateId: templateLibero.id, telefono: telefonoLibero, valori: valoriLiberoPlaceholder }
      : { azione: "messaggio_libero", telefono: telefonoLibero, testo: testoLibero };

    const res = await fetch("/api/whatsapp/invia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.ok) {
      setLiberoStato("ok");
      setTestoLibero("");
      setTimeout(() => setLiberoStato("idle"), 3000);
      await carica();
    } else {
      setLiberoStato("errore");
      setLiberoErrore(json.error ?? "Errore sconosciuto");
    }
  }

  const corseAttive = corse.filter((c) => c.stato_servizio !== "completato");

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">WhatsApp</h1>
          <p className="text-xs text-on-surface-variant">Comunicazione servizio via Meta Cloud API</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/whatsapp/template"
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground border border-border-subtle px-3 py-1.5 rounded-lg transition-colors bg-surface-container"
          >
            <Gear size={13} weight="bold" />
            Template
          </Link>
          <WhatsappLogo size={20} weight="fill" className="text-emerald-400" />
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-3xl mx-auto space-y-6">
        {/* Banner configurazione */}
        {config && !config.configurato && (
          <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-4 py-3">
            <Warning size={18} className="text-amber-400 shrink-0 mt-0.5" weight="fill" />
            <div className="text-sm">
              <p className="font-semibold text-amber-400">Meta WhatsApp non configurato</p>
              <p className="text-on-surface-variant mt-0.5">
                Aggiungi <code className="bg-surface-container px-1 py-0.5 rounded-lg text-xs">META_WHATSAPP_TOKEN</code> e{" "}
                <code className="bg-surface-container px-1 py-0.5 rounded-lg text-xs">META_WHATSAPP_PHONE_NUMBER_ID</code> in{" "}
                <code className="bg-surface-container px-1 py-0.5 rounded-lg text-xs">.env.local</code> per abilitare l&apos;invio.
              </p>
            </div>
          </div>
        )}

        {/* Sezione Webhook / callback URL */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
            <WhatsappLogo size={13} className="text-on-surface-variant" />
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Webhook Meta</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Callback URL da inserire in Meta for Developers</label>
              <div className="flex gap-2">
                <input readOnly value={config?.callbackUrl ?? "…"} className={cn(inputClass, "font-mono text-xs flex-1")} />
                <button
                  type="button"
                  onClick={copiaCallback}
                  className="shrink-0 flex items-center gap-1.5 text-xs bg-surface-container border border-border-subtle text-on-surface-variant hover:text-foreground px-3 py-2 rounded-lg transition-colors"
                >
                  {copiato ? <CheckCircle size={13} weight="fill" className="text-emerald-400" /> : <Copy size={13} />}
                  {copiato ? "Copiato" : "Copia"}
                </button>
              </div>
            </div>
            {config && !config.firmaVerificabile && (
              <p className="text-xs text-amber-400 flex items-start gap-1.5">
                <Warning size={13} weight="fill" className="shrink-0 mt-0.5" />
                META_WHATSAPP_APP_SECRET non impostato: la firma delle richieste webhook non viene verificata.
              </p>
            )}
            <button
              type="button"
              onClick={() => setIstruzioniAperte((v) => !v)}
              className="w-full flex items-center justify-between text-xs text-on-surface-variant hover:text-foreground transition-colors"
            >
              <span className="font-medium">Come configurare il webhook su Meta for Developers</span>
              {istruzioniAperte ? <CaretUp size={12} /> : <CaretDown size={12} />}
            </button>
            {istruzioniAperte && (
              <ol className="list-decimal list-inside text-xs text-on-surface-variant space-y-1">
                <li>Vai su <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">developers.facebook.com/apps</a> → la tua app → WhatsApp → Configuration</li>
                <li>Incolla la Callback URL qui sopra nel campo &quot;Callback URL&quot;</li>
                <li>Come &quot;Verify token&quot; usa lo stesso valore di <code className="bg-surface-container px-1 rounded-lg">META_WHATSAPP_VERIFY_TOKEN</code> in <code className="bg-surface-container px-1 rounded-lg">.env.local</code></li>
                <li>Clicca &quot;Verify and save&quot;, poi iscriviti al campo webhook <code className="bg-surface-container px-1 rounded-lg">messages</code></li>
                <li>Copia Token e Phone Number ID dalla sezione &quot;API Setup&quot; in <code className="bg-surface-container px-1 rounded-lg">META_WHATSAPP_TOKEN</code> / <code className="bg-surface-container px-1 rounded-lg">META_WHATSAPP_PHONE_NUMBER_ID</code></li>
              </ol>
            )}
          </div>
        </section>

        {/* Sezione Avvia flusso servizio → autista */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
            <Play size={13} weight="fill" className="text-on-surface-variant" />
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Avvia flusso servizio (a te stesso)</p>
          </div>
          <form onSubmit={avviaFlusso} className="px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Corsa</label>
              <select value={corsaFlussoId} onChange={(e) => setCorsaFlussoId(e.target.value)} required className={inputClass}>
                <option value="">Seleziona una corsa…</option>
                {corse.map((c) => (
                  <option key={c.id} value={c.id}>
                    {new Date(c.data + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} · {c.ora_partenza.slice(0, 5)} · {c.origine} → {c.destinazione}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Il tuo numero WhatsApp</label>
              <input
                type="tel"
                placeholder="+39 333 1234567"
                value={telefonoAutista}
                onChange={(e) => setTelefonoAutista(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <p className="text-xs text-on-surface-variant">
              Riceverai un messaggio WhatsApp con un bottone &quot;Inizio corsa&quot;: da lì il bot ti guiderà attraverso fine corsa, forma di pagamento e fine servizio.
            </p>
            <button
              type="submit"
              disabled={avvioStato === "caricamento" || !corsaFlussoId || !telefonoAutista}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50",
                avvioStato === "ok" ? "bg-emerald-600 text-white" : avvioStato === "errore" ? "bg-destructive text-white" : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {avvioStato === "caricamento" ? <>Invio…</> : avvioStato === "ok" ? <><CheckCircle size={15} weight="fill" />Inviato</> : <><PaperPlaneTilt size={15} weight="fill" />Avvia flusso WhatsApp</>}
            </button>
            {avvioStato === "errore" && <p className="text-xs text-destructive">{avvioErrore}</p>}
          </form>
        </section>

        {/* Sezione corse attive */}
        {corseAttive.length > 0 && (
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
              <FlagCheckered size={13} weight="fill" className="text-on-surface-variant" />
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Stato servizi in corso</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {corseAttive.map((c) => (
                <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground truncate">{c.origine} → {c.destinazione}</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0", STATO_STYLE[c.stato_servizio])}>
                    {STATO_LABEL[c.stato_servizio]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sezione messaggio a cliente */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
            <Users size={13} className="text-on-surface-variant" />
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Messaggio al cliente</p>
          </div>
          <form onSubmit={inviaMessaggioCliente} className="px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Corsa cliente</label>
              <select value={corsaClienteId} onChange={(e) => setCorsaClienteId(e.target.value)} required className={inputClass}>
                <option value="">Seleziona una corsa…</option>
                {corse.filter((c) => c.cliente_tel).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cliente_nome ?? "Cliente"} · {new Date(c.data + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} · {c.origine} → {c.destinazione}
                  </option>
                ))}
              </select>
              {corse.filter((c) => c.cliente_tel).length === 0 && (
                <p className="text-xs text-on-surface-variant/60 mt-1">Nessuna corsa con numero cliente registrato.</p>
              )}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setModoCliente("libero")} className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors", modoCliente === "libero" ? "border-primary/40 bg-primary/10 text-foreground" : "border-border-subtle text-on-surface-variant")}>Testo libero</button>
              <button type="button" onClick={() => setModoCliente("template")} className={cn("text-xs px-3 py-1.5 rounded-lg border transition-colors", modoCliente === "template" ? "border-primary/40 bg-primary/10 text-foreground" : "border-border-subtle text-on-surface-variant")}>Template registrato</button>
            </div>

            {modoCliente === "libero" ? (
              <textarea
                value={testoCliente}
                onChange={(e) => setTestoCliente(e.target.value)}
                rows={3}
                placeholder="Es. Il Suo autista è in arrivo…"
                className={cn(inputClass, "resize-y")}
              />
            ) : (
              <div className="space-y-2">
                <select value={templateClienteId} onChange={(e) => { setTemplateClienteId(e.target.value); setValoriClientePlaceholder({}); }} className={inputClass}>
                  <option value="">Seleziona template…</option>
                  {templates.filter((t) => t.categoria === "cliente").map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
                {templateCliente && (
                  <div className="bg-surface-container rounded-lg p-3 space-y-2">
                    <p className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap">{templateCliente.corpo}</p>
                    {placeholderCliente.map((ph) => (
                      <input
                        key={ph}
                        placeholder={ph}
                        value={valoriClientePlaceholder[ph] ?? ""}
                        onChange={(e) => setValoriClientePlaceholder((v) => ({ ...v, [ph]: e.target.value }))}
                        className={inputClass}
                      />
                    ))}
                    {placeholderCliente.length > 0 && (
                      <p className="text-xs text-on-surface-variant/70">
                        Anteprima: {riempiPlaceholder(templateCliente.corpo, valoriClientePlaceholder)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={clienteStato === "caricamento" || !corsaClienteId}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50",
                clienteStato === "ok" ? "bg-emerald-600 text-white" : clienteStato === "errore" ? "bg-destructive text-white" : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {clienteStato === "caricamento" ? "Invio…" : clienteStato === "ok" ? <><CheckCircle size={15} weight="fill" />Inviato</> : <><PaperPlaneTilt size={15} weight="fill" />Invia al cliente</>}
            </button>
            {clienteStato === "errore" && <p className="text-xs text-destructive">{clienteErrore}</p>}
          </form>
        </section>

        {/* Sezione messaggio libero a chiunque */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
            <PaperPlaneTilt size={13} className="text-on-surface-variant" />
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Messaggio libero</p>
          </div>
          <form onSubmit={inviaMessaggioLibero} className="px-4 py-3 space-y-3">
            <input
              type="tel"
              placeholder="Numero WhatsApp destinatario"
              value={telefonoLibero}
              onChange={(e) => setTelefonoLibero(e.target.value)}
              required
              className={inputClass}
            />
            <select value={templateLiberoId} onChange={(e) => { setTemplateLiberoId(e.target.value); setValoriLiberoPlaceholder({}); }} className={inputClass}>
              <option value="">Nessun template (testo libero)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.nome} ({t.categoria})</option>
              ))}
            </select>
            {templateLibero ? (
              <div className="bg-surface-container rounded-lg p-3 space-y-2">
                <p className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap">{templateLibero.corpo}</p>
                {placeholderLibero.map((ph) => (
                  <input
                    key={ph}
                    placeholder={ph}
                    value={valoriLiberoPlaceholder[ph] ?? ""}
                    onChange={(e) => setValoriLiberoPlaceholder((v) => ({ ...v, [ph]: e.target.value }))}
                    className={inputClass}
                  />
                ))}
              </div>
            ) : (
              <textarea
                value={testoLibero}
                onChange={(e) => setTestoLibero(e.target.value)}
                rows={3}
                placeholder="Scrivi un messaggio…"
                className={cn(inputClass, "resize-y")}
              />
            )}
            <button
              type="submit"
              disabled={liberoStato === "caricamento" || !telefonoLibero}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50",
                liberoStato === "ok" ? "bg-emerald-600 text-white" : liberoStato === "errore" ? "bg-destructive text-white" : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {liberoStato === "caricamento" ? "Invio…" : liberoStato === "ok" ? <><CheckCircle size={15} weight="fill" />Inviato</> : <><PaperPlaneTilt size={15} weight="fill" />Invia</>}
            </button>
            {liberoStato === "errore" && <p className="text-xs text-destructive">{liberoErrore}</p>}
          </form>
        </section>

        {/* Storico messaggi */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
            <ClockCounterClockwise size={13} className="text-on-surface-variant" />
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Storico messaggi</p>
          </div>
          {caricamento && <p className="px-4 py-6 text-sm text-on-surface-variant text-center">Caricamento…</p>}
          {!caricamento && log.length === 0 && (
            <p className="px-4 py-6 text-sm text-on-surface-variant text-center">Nessun messaggio ancora inviato.</p>
          )}
          <div className="divide-y divide-border-subtle">
            {log.map((m) => (
              <div key={m.id} className="px-4 py-2.5 flex items-start gap-3">
                {m.stato === "errore" ? (
                  <Warning size={14} weight="fill" className="text-destructive shrink-0 mt-0.5" />
                ) : m.direzione === "in" ? (
                  <ClockCounterClockwise size={14} className="text-sky-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={14} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{m.telefono}</p>
                  <p className="text-xs text-on-surface-variant truncate">{m.contenuto ?? "—"}</p>
                </div>
                <span className="text-xs text-on-surface-variant shrink-0">
                  {new Date(m.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
