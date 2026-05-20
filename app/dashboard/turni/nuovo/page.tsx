"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { sendPush } from "@/lib/push";

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
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Indietro
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold text-foreground">Nuovo turno</h1>
      </div>

      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Registra il tuo orario di lavoro</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-4">
            <Field label="Data">
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ora inizio">
                <input type="time" value={oraInizio} onChange={(e) => setOraInizio(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
              <Field label="Ora fine">
                <input type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
            </div>
            <Field label="Note (opzionale)">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. aeroporto, evento…" className={inputClass} />
            </Field>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={caricamento}
                className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {caricamento ? "Salvataggio…" : "Salva turno"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-muted text-foreground text-xs font-medium px-4 py-2 rounded transition-colors hover:bg-muted/70"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
