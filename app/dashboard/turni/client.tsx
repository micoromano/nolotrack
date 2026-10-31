"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rangeMese } from "@/lib/utils";
import { Download } from "@phosphor-icons/react";

/** Valore speciale della drop-down: nessun filtro (ultimi 30 turni). */
const TUTTI = "tutti";

function labelMese(m: string) {
  const [anno, mes] = m.split("-");
  return new Date(+anno, +mes - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function MeseSelect({ mese, mesiDisponibili }: { mese: string; mesiDisponibili: string[] }) {
  const router = useRouter();
  const opzioni = mese !== TUTTI && !mesiDisponibili.includes(mese) ? [mese, ...mesiDisponibili] : mesiDisponibili;

  return (
    <select
      value={mese}
      onChange={(e) =>
        router.push(`/dashboard/turni?mese=${e.target.value}`)
      }
      aria-label="Filtra per mese"
      className="bg-surface-container-lowest border border-border-subtle text-sm text-foreground px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary capitalize"
    >
      <option value={TUTTI}>Ultimi 30 turni</option>
      {opzioni.map((m) => (
        <option key={m} value={m}>
          {labelMese(m)}
        </option>
      ))}
    </select>
  );
}

export function PdfTurniButton({ mese }: { mese: string }) {
  const [caricamento, setCaricamento] = useState(false);
  const disabilitato = mese === TUTTI;

  async function scarica() {
    setCaricamento(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { inizio, fine } = rangeMese(mese);
      const { generaPDFTurni } = await import("@/lib/pdf-allegati");
      const { filename, content } = await generaPDFTurni(user.id, inizio, fine);

      const byteChars = atob(content);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <button
      onClick={scarica}
      disabled={caricamento || disabilitato}
      title={disabilitato ? "Seleziona un mese per esportare il PDF" : "Scarica i turni del mese in PDF"}
      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-container text-on-surface-variant hover:text-foreground transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={13} weight="bold" />
      {caricamento ? "Generazione…" : "PDF"}
    </button>
  );
}
