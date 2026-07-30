"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Trash } from "@phosphor-icons/react";

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono";

export default function EditaCarburantePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");
  const [data, setData] = useState("");
  const [targa, setTarga] = useState("");
  const [km, setKm] = useState("");
  const [litri, setLitri] = useState("");
  const [prezzoLitro, setPrezzoLitro] = useState("");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: rif, error } = await supabase.from("carburante").select("*").eq("id", id).single();
      if (error || !rif) { router.push("/dashboard/carburante"); return; }
      setData(rif.data);
      setTarga(rif.targa);
      setKm(rif.km != null ? String(rif.km) : "");
      setLitri(String(rif.litri));
      setPrezzoLitro(String(rif.prezzo_litro));
      setImporto(String(rif.importo));
      setNote(rif.note ?? "");
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("carburante").update({
      data,
      targa,
      km: km ? parseFloat(km) : null,
      litri: parseFloat(litri),
      prezzo_litro: parseFloat(prezzoLitro),
      importo: parseFloat(importo),
      note: note || null,
    }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/carburante");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questo rifornimento?")) return;
    setDeleting(true);
    await supabase.from("carburante").delete().eq("id", id);
    router.push("/dashboard/carburante");
    router.refresh();
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Carburante
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Modifica rifornimento</h1>
      </div>
      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <form onSubmit={salva} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} /></Field>
              <Field label="Targa"><input type="text" value={targa} onChange={(e) => setTarga(e.target.value.toUpperCase())} required placeholder="AB123CD" className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Litri"><input type="number" step="0.01" value={litri} onChange={(e) => setLitri(e.target.value)} required placeholder="45.00" className={inputClass} /></Field>
              <Field label="€/litro"><input type="number" step="0.001" value={prezzoLitro} onChange={(e) => setPrezzoLitro(e.target.value)} required placeholder="1.899" className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Importo (€)"><input type="number" step="0.01" value={importo} onChange={(e) => setImporto(e.target.value)} required placeholder="85.45" className={inputClass} /></Field>
              <Field label="Km tachigrafo (opz.)"><input type="number" value={km} onChange={(e) => setKm(e.target.value)} placeholder="123456" className={inputClass} /></Field>
            </div>
            <Field label="Note (opz.)"><input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass.replace("font-mono", "")} /></Field>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                <CheckCircle size={15} weight="fill" />
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
              <button type="button" onClick={() => router.back()} className="bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-muted/70">Annulla</button>
              <button type="button" onClick={elimina} disabled={deleting}
                className="ml-auto flex items-center gap-1.5 text-sm text-destructive hover:bg-destructive/10 px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                <Trash size={14} weight="bold" />
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
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
