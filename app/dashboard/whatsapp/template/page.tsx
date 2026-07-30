"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WhatsappTemplate, CategoriaTemplateWA } from "@/types";
import { ArrowLeft, Plus, PencilSimple, Trash, ChatCircleDots, Warning } from "@phosphor-icons/react";

const inputClass =
  "w-full bg-surface-container-lowest border border-border-subtle text-sm text-foreground placeholder:text-on-surface-variant/50 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

const CATEGORIE: { id: CategoriaTemplateWA; label: string }[] = [
  { id: "autista", label: "Autista" },
  { id: "cliente", label: "Cliente" },
  { id: "libero", label: "Libero" },
];

const REGEX_PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
function estraiPlaceholder(corpo: string): string[] {
  const trovati = new Set<string>();
  for (const m of corpo.matchAll(REGEX_PLACEHOLDER)) trovati.add(m[1]);
  return Array.from(trovati);
}

interface FormTemplate {
  nome: string;
  categoria: CategoriaTemplateWA;
  corpo: string;
}

const FORM_VUOTO: FormTemplate = { nome: "", categoria: "cliente", corpo: "" };

export default function TemplateWhatsappPage() {
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [form, setForm] = useState<FormTemplate>(FORM_VUOTO);
  const [modificaId, setModificaId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState("");

  const carica = useCallback(async () => {
    setCaricamento(true);
    const res = await fetch("/api/whatsapp/templates");
    const json = await res.json();
    setTemplates(json.templates ?? []);
    setCaricamento(false);
  }, []);

  useEffect(() => { carica(); }, [carica]);

  function iniziaModifica(t: WhatsappTemplate) {
    setModificaId(t.id);
    setForm({ nome: t.nome, categoria: t.categoria, corpo: t.corpo });
    setErrore("");
  }

  function annullaModifica() {
    setModificaId(null);
    setForm(FORM_VUOTO);
    setErrore("");
  }

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.corpo.trim()) {
      setErrore("Nome e corpo del messaggio sono obbligatori.");
      return;
    }
    setSalvando(true);
    setErrore("");

    const res = await fetch(modificaId ? `/api/whatsapp/templates/${modificaId}` : "/api/whatsapp/templates", {
      method: modificaId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();

    if (res.ok) {
      annullaModifica();
      await carica();
    } else {
      setErrore(json.error ?? "Errore sconosciuto");
    }
    setSalvando(false);
  }

  async function elimina(id: string) {
    if (!confirm("Eliminare questo template?")) return;
    await fetch(`/api/whatsapp/templates/${id}`, { method: "DELETE" });
    if (modificaId === id) annullaModifica();
    await carica();
  }

  const placeholderAnteprima = estraiPlaceholder(form.corpo);

  return (
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <Link href="/dashboard/whatsapp" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> WhatsApp
        </Link>
        <span className="text-on-surface-variant text-xs">/</span>
        <div>
          <h1 className="font-heading text-lg font-bold text-primary leading-none">Template</h1>
          <p className="text-xs text-on-surface-variant">Messaggi riutilizzabili con placeholder {"{{nome}}"}</p>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-2xl mx-auto space-y-6">
        {/* Form crea/modifica */}
        <section className="glass-card rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
            <Plus size={12} weight="bold" />
            {modificaId ? "Modifica template" : "Nuovo template"}
          </h2>
          <form onSubmit={salva} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                placeholder="Nome template"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className={cn(inputClass, "sm:col-span-2")}
              />
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as CategoriaTemplateWA }))}
                className={inputClass}
              >
                {CATEGORIE.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <textarea
              value={form.corpo}
              onChange={(e) => setForm((f) => ({ ...f, corpo: e.target.value }))}
              rows={4}
              placeholder={"Es. Buongiorno {{nome}}, il servizio {{origine}} → {{destinazione}} è confermato per le {{ora}}."}
              className={cn(inputClass, "resize-y font-mono text-xs")}
            />
            {placeholderAnteprima.length > 0 && (
              <p className="text-xs text-on-surface-variant">
                Placeholder rilevati: {placeholderAnteprima.map((p) => (
                  <code key={p} className="bg-surface-container px-1.5 py-0.5 rounded-lg mx-0.5">{`{{${p}}}`}</code>
                ))}
              </p>
            )}
            {errore && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <Warning size={13} weight="fill" /> {errore}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Plus size={14} weight="bold" />
                {salvando ? "…" : modificaId ? "Salva modifiche" : "Crea template"}
              </button>
              {modificaId && (
                <button type="button" onClick={annullaModifica} className="text-xs text-on-surface-variant hover:text-foreground px-3 py-2.5">
                  Annulla
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Lista template per categoria */}
        {caricamento && <p className="text-sm text-on-surface-variant text-center py-6">Caricamento…</p>}

        {!caricamento && templates.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-6">Nessun template registrato.</p>
        )}

        {CATEGORIE.map((cat) => {
          const gruppo = templates.filter((t) => t.categoria === cat.id);
          if (gruppo.length === 0) return null;
          return (
            <section key={cat.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
                <ChatCircleDots size={13} className="text-on-surface-variant" />
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">{cat.label}</p>
              </div>
              <div className="divide-y divide-border-subtle">
                {gruppo.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.nome}</p>
                      <p className="text-xs text-on-surface-variant font-mono mt-0.5 line-clamp-2">{t.corpo}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => iniziaModifica(t)} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
                        <PencilSimple size={13} weight="bold" />
                      </button>
                      <button onClick={() => elimina(t.id)} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-400/10">
                        <Trash size={13} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
