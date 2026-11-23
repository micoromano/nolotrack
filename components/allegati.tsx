"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, FilePdf, File as FileIcon, Trash, DownloadSimple, UploadSimple, Camera } from "@phosphor-icons/react";
import {
  ACCEPT_INPUT,
  DIMENSIONE_MAX,
  MAX_ALLEGATI_PER_VOCE,
  formatDimensione,
  validaFile,
  type Allegato,
  type EntitaAllegato,
} from "@/lib/allegati";

// Le foto del telefono vengono ridimensionate prima dell'upload: bastano per
// leggere uno scontrino e occupano un decimo dello spazio.
const LATO_MAX = 2000;
const SOGLIA_COMPRESSIONE = 1.5 * 1024 * 1024;

async function comprimiImmagine(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  if (file.size <= SOGLIA_COMPRESSIONE) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scala = Math.min(1, LATO_MAX / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scala);
    canvas.height = Math.round(bmp.height * scala);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    const nome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg" });
  } catch {
    return file; // formato non decodificabile dal browser: si carica com'è
  }
}

async function errore(res: Response, fallback: string): Promise<string> {
  const j = await res.json().catch(() => null);
  return (j as { error?: string } | null)?.error ?? fallback;
}

async function caricaFile(entita: EntitaAllegato, entitaId: string, originale: File): Promise<Allegato> {
  const file = await comprimiImmagine(originale);
  const msg = validaFile(file.type, file.size);
  if (msg) throw new Error(`${originale.name}: ${msg}`);

  const reg = await fetch("/api/allegati", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entita, entitaId, nomeFile: file.name, contentType: file.type, dimensione: file.size }),
  });
  if (!reg.ok) throw new Error(await errore(reg, "Registrazione allegato non riuscita."));
  const { id, uploadUrl } = (await reg.json()) as { id: string; uploadUrl: string };

  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error(`Caricamento su R2 non riuscito (HTTP ${put.status}).`);

  const conf = await fetch(`/api/allegati/${id}/conferma`, { method: "POST" });
  if (!conf.ok) throw new Error(await errore(conf, "Conferma caricamento non riuscita."));
  return ((await conf.json()) as { allegato: Allegato }).allegato;
}

export default function Allegati({ entita, entitaId }: { entita: EntitaAllegato; entitaId: string }) {
  const [allegati, setAllegati] = useState<Allegato[]>([]);
  const [stato, setStato] = useState<"caricamento" | "pronto" | "non_configurato">("caricamento");
  const [inCorso, setInCorso] = useState(0);
  const [errori, setErrori] = useState<string[]>([]);
  const inputFile = useRef<HTMLInputElement>(null);
  const inputFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let annullato = false;
    (async () => {
      const res = await fetch(`/api/allegati?entita=${entita}&id=${entitaId}`);
      if (annullato) return;
      if (res.status === 503) { setStato("non_configurato"); return; }
      if (res.ok) setAllegati(((await res.json()) as { allegati: Allegato[] }).allegati);
      else setErrori([await errore(res, "Impossibile leggere gli allegati.")]);
      setStato("pronto");
    })();
    return () => { annullato = true; };
  }, [entita, entitaId]);

  async function aggiungi(files: FileList | null) {
    if (!files?.length) return;
    const lista = Array.from(files).slice(0, Math.max(0, MAX_ALLEGATI_PER_VOCE - allegati.length));
    setErrori([]);
    setInCorso((n) => n + lista.length);
    // Upload in sequenza: su rete mobile è più affidabile che in parallelo
    for (const f of lista) {
      try {
        const nuovo = await caricaFile(entita, entitaId, f);
        setAllegati((prev) => [...prev, nuovo]);
      } catch (e) {
        setErrori((prev) => [...prev, (e as Error).message]);
      } finally {
        setInCorso((n) => n - 1);
      }
    }
  }

  async function elimina(a: Allegato) {
    if (!confirm(`Eliminare "${a.nome_file}"?`)) return;
    const res = await fetch(`/api/allegati/${a.id}`, { method: "DELETE" });
    if (res.ok) setAllegati((prev) => prev.filter((x) => x.id !== a.id));
    else setErrori([await errore(res, "Eliminazione non riuscita.")]);
  }

  if (stato === "non_configurato") return null;

  const pieno = allegati.length >= MAX_ALLEGATI_PER_VOCE;
  const btn = "flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50";

  return (
    <section className="max-w-3xl glass-card rounded-2xl p-5 mt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-secondary-container">
          <Paperclip size={13} weight="bold" />
          Allegati {allegati.length > 0 && <span className="font-mono">({allegati.length})</span>}
        </h2>
        <div className="flex gap-2">
          <button type="button" className={btn + " sm:hidden"} disabled={pieno || stato !== "pronto"} onClick={() => inputFoto.current?.click()}>
            <Camera size={14} weight="bold" /> Foto
          </button>
          <button type="button" className={btn} disabled={pieno || stato !== "pronto"} onClick={() => inputFile.current?.click()}>
            <UploadSimple size={14} weight="bold" /> Carica file
          </button>
        </div>
        <input ref={inputFile} type="file" accept={ACCEPT_INPUT} multiple hidden
          onChange={(e) => { aggiungi(e.target.files); e.target.value = ""; }} />
        <input ref={inputFoto} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => { aggiungi(e.target.files); e.target.value = ""; }} />
      </div>

      {stato === "caricamento" && <p className="text-xs text-on-surface-variant">Caricamento…</p>}
      {stato === "pronto" && allegati.length === 0 && inCorso === 0 && (
        <p className="text-xs text-on-surface-variant">
          Nessun allegato. Puoi aggiungere foto di scontrini o ricevute (JPG, PNG, HEIC, PDF, max {DIMENSIONE_MAX / 1024 / 1024} MB).
        </p>
      )}

      {allegati.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allegati.map((a) => {
            const anteprima = /^image\/(jpeg|png|webp)$/.test(a.content_type);
            return (
              <li key={a.id} className="group relative rounded-lg border border-border-subtle overflow-hidden bg-surface-container-lowest">
                <a href={`/api/allegati/${a.id}`} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] bg-surface-container-low">
                  {anteprima ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL firmato e temporaneo, non ottimizzabile
                    <img src={`/api/allegati/${a.id}`} alt={a.nome_file} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      {a.content_type === "application/pdf" ? <FilePdf size={32} weight="light" /> : <FileIcon size={32} weight="light" />}
                    </span>
                  )}
                </a>
                <div className="px-2 py-1.5 flex items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate" title={a.nome_file}>{a.nome_file}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">{formatDimensione(a.dimensione)}</p>
                  </div>
                  <a href={`/api/allegati/${a.id}?download=1`} title="Scarica" className="p-1 text-on-surface-variant hover:text-primary">
                    <DownloadSimple size={14} weight="bold" />
                  </a>
                  <button type="button" onClick={() => elimina(a)} title="Elimina" className="p-1 text-on-surface-variant hover:text-rose-400">
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {inCorso > 0 && <p className="text-xs text-primary mt-3">Caricamento di {inCorso} file…</p>}
      {errori.map((e, i) => <p key={i} className="text-xs text-rose-400 mt-2">{e}</p>)}
    </section>
  );
}
