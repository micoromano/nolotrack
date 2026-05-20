"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Trash } from "@phosphor-icons/react";

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function EditaTurnoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");
  const [data, setData] = useState("");
  const [oraInizio, setOraInizio] = useState("");
  const [oraFine, setOraFine] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: turno, error } = await supabase.from("turni").select("*").eq("id", id).single();
      if (error || !turno) { router.push("/dashboard/turni"); return; }
      setData(turno.data);
      setOraInizio(turno.ora_inizio.slice(0, 5));
      setOraFine(turno.ora_fine.slice(0, 5));
      setNote(turno.note ?? "");
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    if (oraFine <= oraInizio) { setErrore("L'ora di fine deve essere dopo l'ora di inizio."); return; }
    setSaving(true);
    const { error } = await supabase.from("turni").update({ data, ora_inizio: oraInizio, ora_fine: oraFine, note: note || null }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/turni");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questo turno?")) return;
    setDeleting(true);
    await supabase.from("turni").delete().eq("id", id);
    router.push("/dashboard/turni");
    router.refresh();
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Turni
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Modifica turno</h1>
      </div>
      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Modifica l'orario di lavoro</p>
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
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                <CheckCircle size={13} weight="fill" />
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
              <button type="button" onClick={() => router.back()} className="bg-muted text-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-muted/70">
                Annulla
              </button>
              <button type="button" onClick={elimina} disabled={deleting}
                className="ml-auto flex items-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                <Trash size={13} weight="bold" />
                {deleting ? "…" : "Elimina"}
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
