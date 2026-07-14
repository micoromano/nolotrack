"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { sendPush } from "@/lib/push";
import { ArrowLeft, CalendarBlank, Clock, NotePencil, CheckCircle } from "@phosphor-icons/react";

export default function NuovoTurnoPage() {
  const oggi = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(oggi);
  const [oraInizio, setOraInizio] = useState("");
  const [oraFine, setOraFine] = useState("");
  const [note, setNote] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    if (oraFine <= oraInizio) {
      setErrore("L'ora di fine deve essere dopo l'ora di inizio.");
      return;
    }
    setCaricamento(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("turni").upsert({
      autista_id: user!.id,
      data,
      ora_inizio: oraInizio,
      ora_fine: oraFine,
      note: note || null,
    }, { onConflict: "autista_id,data" });
    if (error) {
      setErrore("Errore: " + error.message);
      setCaricamento(false);
      return;
    }
    const dataFmt = new Date(data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
    await sendPush({
      title: "Turno registrato",
      body: `${dataFmt} · ${oraInizio}–${oraFine}`,
      url: "/dashboard/turni",
      tag: "turno-salvato",
    });
    router.push("/dashboard/turni");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Turni
        </button>
        <span className="text-on-surface-variant/40 text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Nuovo turno</h1>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-lg mx-auto">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-5">
            <Clock size={13} weight="bold" className="text-sky-400" />
            Registra il tuo orario di lavoro
          </h2>
          <form onSubmit={salva} className="space-y-4">
            <Field label="Data" icon={CalendarBlank}>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ora inizio" icon={Clock}>
                <input type="time" value={oraInizio} onChange={(e) => setOraInizio(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
              <Field label="Ora fine" icon={Clock}>
                <input type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
            </div>
            <Field label="Note (opzionale)" icon={NotePencil}>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. aeroporto, evento…" className={inputClass} />
            </Field>
            {errore && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-xs shrink-0">!</span>
                {errore}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={caricamento}
                className="flex items-center gap-1.5 bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {caricamento ? (
                  "Salvataggio…"
                ) : (
                  <>
                    <CheckCircle size={15} weight="fill" />
                    Salva turno
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-surface-container text-on-surface-variant text-sm font-medium px-4 py-2.5 rounded-lg border border-border-subtle transition-colors hover:bg-surface-variant/50"
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

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
        {Icon && <Icon size={11} weight="bold" />}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
