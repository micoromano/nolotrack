"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { generaContenutoEmail, type TipoDocumento } from "@/lib/email-content";
import { cn } from "@/lib/utils";
import {
  PaperPlaneTilt,
  EnvelopeSimple,
  FileText,
  CalendarBlank,
  CheckCircle,
  Warning,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";

// ─────────────────────────────────────────────────────
// Tipi
// ─────────────────────────────────────────────────────
interface InvioRecord {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  documenti: string[];
  esito: "ok" | "errore";
  errore?: string;
}

const DOCUMENTI_DISPONIBILI: { id: TipoDocumento; label: string }[] = [
  { id: "rapportino", label: "Rapportino giornaliero" },
  { id: "stipendio", label: "Riepilogo stipendio mensile" },
  { id: "carburante", label: "Registro carburante" },
];

const inputClass =
  "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

// ─────────────────────────────────────────────────────
// Helpers date
// ─────────────────────────────────────────────────────
function oggi() {
  return new Date().toISOString().split("T")[0];
}
function inizioSettimana() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}
function inizioMese() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────
export default function InviaPage() {
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState("");
  const [gmailConfigurato, setGmailConfigurato] = useState<boolean | null>(null);
  const [istruzioniAperte, setIstruzioniAperte] = useState(false);

  const [destinatario, setDestinatario] = useState("");
  const [dataInizio, setDataInizio] = useState(inizioMese());
  const [dataFine, setDataFine] = useState(oggi());
  const [documentiSelezionati, setDocumentiSelezionati] = useState<Set<TipoDocumento>>(
    new Set(["rapportino"])
  );
  const [corpoEmail, setCorpoEmail] = useState("");
  const [oggettoEmail, setOggettoEmail] = useState("");

  const [caricandoAnteprima, setCaricandoAnteprima] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [invio, setInvio] = useState<"idle" | "caricamento" | "ok" | "errore">("idle");
  const [erroreInvio, setErroreInvio] = useState("");

  const [storico, setStorico] = useState<InvioRecord[]>([]);

  // Carica email utente
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, [supabase]);

  // Carica ultimo destinatario da localStorage
  useEffect(() => {
    const salvato = localStorage.getItem("nolo_ultimo_destinatario");
    if (salvato) setDestinatario(salvato);
  }, []);

  // Controlla se Gmail è configurato (via health check)
  useEffect(() => {
    fetch("/api/invia-email", { method: "POST", body: JSON.stringify({ _check: true }), headers: { "Content-Type": "application/json" } })
      .then((r) => {
        // 503 = non configurato, 400/401 = configurato ma bad request
        setGmailConfigurato(r.status !== 503);
      })
      .catch(() => setGmailConfigurato(null));
  }, []);

  // Aggiorna oggetto automaticamente
  useEffect(() => {
    const docs = DOCUMENTI_DISPONIBILI.filter((d) => documentiSelezionati.has(d.id))
      .map((d) => d.label)
      .join(", ");
    const periodoFmt =
      dataInizio === dataFine
        ? new Date(dataInizio + "T00:00:00").toLocaleDateString("it-IT")
        : `${new Date(dataInizio + "T00:00:00").toLocaleDateString("it-IT")} – ${new Date(dataFine + "T00:00:00").toLocaleDateString("it-IT")}`;
    setOggettoEmail(docs ? `[NoloTrack] ${docs} — ${periodoFmt}` : "");
  }, [documentiSelezionati, dataInizio, dataFine]);

  // Genera anteprima corpo email
  const generaAnteprima = useCallback(async () => {
    if (documentiSelezionati.size === 0) {
      setCorpoEmail("Seleziona almeno un documento.");
      return;
    }
    setCaricandoAnteprima(true);
    const parti: string[] = [];
    for (const tipo of DOCUMENTI_DISPONIBILI.filter((d) => documentiSelezionati.has(d.id))) {
      const contenuto = await generaContenutoEmail(tipo.id, dataInizio, dataFine);
      parti.push(contenuto);
    }
    setCorpoEmail(parti.join("\n\n\n"));
    setCaricandoAnteprima(false);
  }, [documentiSelezionati, dataInizio, dataFine]);

  // Genera anteprima quando cambia selezione o periodo
  useEffect(() => {
    generaAnteprima();
  }, [generaAnteprima]);

  function toggleDocumento(id: TipoDocumento) {
    setDocumentiSelezionati((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function impostaPeriodo(tipo: "oggi" | "settimana" | "mese") {
    if (tipo === "oggi") {
      setDataInizio(oggi());
      setDataFine(oggi());
    } else if (tipo === "settimana") {
      setDataInizio(inizioSettimana());
      setDataFine(oggi());
    } else {
      setDataInizio(inizioMese());
      setDataFine(oggi());
    }
  }

  async function inviaEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!destinatario || !corpoEmail || !oggettoEmail) return;

    setInvio("caricamento");
    setErroreInvio("");

    localStorage.setItem("nolo_ultimo_destinatario", destinatario);

    // Genera i PDF allegati client-side
    setGenerandoPDF(true);
    let allegati: { filename: string; content: string }[] = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { generaPDFRapportino, generaPDFStipendio, generaPDFCarburante } =
          await import("@/lib/pdf-allegati");

        const promesse: Promise<{ filename: string; content: string }>[] = [];
        if (documentiSelezionati.has("rapportino")) {
          promesse.push(generaPDFRapportino(user.id, dataInizio, dataFine));
        }
        if (documentiSelezionati.has("stipendio")) {
          promesse.push(generaPDFStipendio(user.id, dataInizio, dataFine));
        }
        if (documentiSelezionati.has("carburante")) {
          promesse.push(generaPDFCarburante(user.id, dataInizio, dataFine));
        }
        allegati = await Promise.all(promesse);
      }
    } catch (err) {
      console.error("Errore generazione PDF:", err);
      // Continua senza allegati piuttosto che bloccare l'invio
    } finally {
      setGenerandoPDF(false);
    }

    const res = await fetch("/api/invia-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: destinatario,
        subject: oggettoEmail,
        body: corpoEmail,
        attachments: allegati,
      }),
    });

    const json = await res.json();

    const record: InvioRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString("it-IT"),
      to: destinatario,
      subject: oggettoEmail,
      documenti: DOCUMENTI_DISPONIBILI.filter((d) => documentiSelezionati.has(d.id)).map((d) => d.label),
      esito: res.ok ? "ok" : "errore",
      errore: res.ok ? undefined : json.error,
    };

    setStorico((prev) => [record, ...prev]);

    if (res.ok) {
      setInvio("ok");
      setTimeout(() => setInvio("idle"), 4000);
    } else {
      setInvio("errore");
      setErroreInvio(json.error ?? "Errore sconosciuto.");
    }
  }

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Invia documenti</h1>
          <p className="text-xs text-muted-foreground">Componi e invia rapporti via email</p>
        </div>
        <EnvelopeSimple size={18} className="text-muted-foreground" />
      </div>

      <div className="p-6 space-y-5 max-w-3xl">
        {/* Banner Gmail non configurato */}
        {gmailConfigurato === false && (
          <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3">
            <Warning size={18} className="text-amber-400 shrink-0 mt-0.5" weight="fill" />
            <div className="text-sm">
              <p className="font-semibold text-amber-400">Gmail non configurato</p>
              <p className="text-muted-foreground mt-0.5">
                Aggiungi <code className="bg-muted px-1 py-0.5 rounded-lg text-xs">GMAIL_USER</code> e{" "}
                <code className="bg-muted px-1 py-0.5 rounded-lg text-xs">GMAIL_APP_PASSWORD</code> in{" "}
                <code className="bg-muted px-1 py-0.5 rounded-lg text-xs">.env.local</code> per abilitare l&apos;invio.
              </p>
            </div>
          </div>
        )}

        {/* Istruzioni App Password Gmail */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIstruzioniAperte((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <EnvelopeSimple size={13} />
              Come ottenere la App Password Gmail
            </span>
            {istruzioniAperte ? <CaretUp size={12} /> : <CaretDown size={12} />}
          </button>
          {istruzioniAperte && (
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground space-y-1.5">
              <ol className="list-decimal list-inside space-y-1">
                <li>Vai su <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-primary underline">account.google.com → Sicurezza</a></li>
                <li>Attiva la <strong className="text-foreground">Verifica in 2 passaggi</strong> se non è già attiva</li>
                <li>Cerca <strong className="text-foreground">Password per le app</strong> (nella stessa sezione Sicurezza)</li>
                <li>Crea una nuova app password per &quot;NoloTrack&quot;</li>
                <li>Copia la password (16 caratteri con spazi) e incollala in <code className="bg-muted px-1 rounded-lg">GMAIL_APP_PASSWORD</code> nel file <code className="bg-muted px-1 rounded-lg">.env.local</code></li>
              </ol>
            </div>
          )}
        </div>

        <form onSubmit={inviaEmail} className="space-y-5">
          {/* A) Destinatario */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center gap-2">
              <EnvelopeSimple size={13} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Destinatario</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@esempio.com"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  required
                  className={cn(inputClass, "flex-1")}
                />
                {userEmail && (
                  <button
                    type="button"
                    onClick={() => setDestinatario(userEmail)}
                    className="shrink-0 text-xs bg-muted border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors"
                  >
                    Usa mia email
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Oggetto</label>
                <input
                  type="text"
                  value={oggettoEmail}
                  onChange={(e) => setOggettoEmail(e.target.value)}
                  className={inputClass}
                  placeholder="Oggetto email"
                />
              </div>
            </div>
          </section>

          {/* B) Periodo */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center gap-2">
              <CalendarBlank size={13} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Periodo</p>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(["oggi", "settimana", "mese"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => impostaPeriodo(tipo)}
                    className="text-xs bg-muted border border-border text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors capitalize"
                  >
                    {tipo === "oggi" ? "Oggi" : tipo === "settimana" ? "Questa settimana" : "Questo mese"}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Da</label>
                  <input
                    type="date"
                    value={dataInizio}
                    onChange={(e) => setDataInizio(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">A</label>
                  <input
                    type="date"
                    value={dataFine}
                    onChange={(e) => setDataFine(e.target.value)}
                    min={dataInizio}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* C) Documenti */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center gap-2">
              <FileText size={13} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Documenti da allegare</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {DOCUMENTI_DISPONIBILI.map((doc) => (
                <label
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                    documentiSelezionati.has(doc.id)
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={documentiSelezionati.has(doc.id)}
                    onChange={() => toggleDocumento(doc.id)}
                    className="accent-primary w-3.5 h-3.5"
                  />
                  <FileText
                    size={14}
                    weight={documentiSelezionati.has(doc.id) ? "fill" : "regular"}
                    className={documentiSelezionati.has(doc.id) ? "text-primary" : ""}
                  />
                  <span className="text-sm">{doc.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* D) Anteprima */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Anteprima corpo email</p>
              {caricandoAnteprima && (
                <span className="text-xs text-muted-foreground animate-pulse">Generazione…</span>
              )}
            </div>
            <div className="px-4 py-3">
              <textarea
                value={corpoEmail}
                onChange={(e) => setCorpoEmail(e.target.value)}
                rows={12}
                className={cn(inputClass, "font-mono text-xs resize-y")}
                placeholder="Seleziona un documento e un periodo per generare l'anteprima…"
              />
            </div>
          </section>

          {/* E) Invio */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={invio === "caricamento" || gmailConfigurato === false || documentiSelezionati.size === 0}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
                invio === "caricamento"
                  ? "bg-primary/50 text-primary-foreground cursor-wait"
                  : invio === "ok"
                  ? "bg-emerald-600 text-white"
                  : invio === "errore"
                  ? "bg-destructive text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90",
                (gmailConfigurato === false || documentiSelezionati.size === 0) &&
                  invio === "idle" &&
                  "opacity-50 cursor-not-allowed"
              )}
            >
              {invio === "caricamento" && generandoPDF ? (
                <>
                  <PaperPlaneTilt size={16} className="animate-pulse" />
                  Generazione PDF…
                </>
              ) : invio === "caricamento" ? (
                <>
                  <PaperPlaneTilt size={16} className="animate-pulse" />
                  Invio in corso…
                </>
              ) : invio === "ok" ? (
                <>
                  <CheckCircle size={16} weight="fill" />
                  Email inviata!
                </>
              ) : invio === "errore" ? (
                <>
                  <Warning size={16} weight="fill" />
                  Errore invio
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={16} weight="fill" />
                  Invia email
                </>
              )}
            </button>

            {invio === "errore" && erroreInvio && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                <Warning size={15} weight="fill" className="shrink-0 mt-0.5" />
                <span>{erroreInvio}</span>
              </div>
            )}
          </div>
        </form>

        {/* F) Storico invii di sessione */}
        {storico.length > 0 && (
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Storico invii (sessione)</p>
            </div>
            <div className="divide-y divide-border">
              {storico.map((rec) => (
                <div key={rec.id} className="px-4 py-3 flex items-start gap-3">
                  {rec.esito === "ok" ? (
                    <CheckCircle size={15} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Warning size={15} weight="fill" className="text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{rec.to}</p>
                    <p className="text-xs text-muted-foreground truncate">{rec.subject}</p>
                    {rec.errore && (
                      <p className="text-xs text-destructive mt-0.5">{rec.errore}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{rec.timestamp}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
