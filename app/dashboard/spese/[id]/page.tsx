"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Trash } from "@phosphor-icons/react";

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function EditaSpesaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");
  const [data, setData] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [importo, setImporto] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: spesa, error } = await supabase.from("spese").select("*").eq("id", id).single();
      if (error || !spesa) { router.push("/dashboard/spese"); return; }
      setData(spesa.data);
      setDescrizione(spesa.descrizione);
      setImporto(String(spesa.importo));
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    const importoNum = parseFloat(importo.replace(",", "."));
    if (isNaN(importoNum) || importoNum <= 0) { setErrore("Importo non valido."); return; }
    setSaving(true);
    const { error } = await supabase.from("spese").update({ data, descrizione: descrizione.trim(), importo: importoNum }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/spese");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questa spesa?")) return;
    setDeleting(true);
    await supabase.from("spese").delete().eq("id", id);
    router.push("/dashboard/spese");
    router.refresh();
  }

  if (loading) return <div className="px-4 md:px-10 py-8 text-sm text-on-surface-variant">Caricamento…</div>;

  return (
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Spese
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Modifica spesa</h1>
      </header>
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-3xl glass-card rounded-2xl">
          <form onSubmit={salva} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Descrizione</label>
              <input type="text" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Importo (€)</label>
              <input type="text" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} required className={inputClass + " font-mono"} />
            </div>
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
