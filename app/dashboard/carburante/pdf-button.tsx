"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generaPDFCarburante } from "@/lib/pdf-allegati";
import { FilePdf } from "@phosphor-icons/react";

interface Props {
  mese: string; // "YYYY-MM" or "" for all periods
}

export default function CarburantePDFButton({ mese }: Props) {
  const [loading, setLoading] = useState(false);

  async function scarica() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let dataInizio: string;
      let dataFine: string;

      if (mese) {
        const [anno, mes] = mese.split("-");
        dataInizio = `${anno}-${mes}-01`;
        const lastDay = new Date(+anno, +mes, 0).getDate();
        dataFine = `${anno}-${mes}-${String(lastDay).padStart(2, "0")}`;
      } else {
        dataInizio = "2000-01-01";
        dataFine = "2099-12-31";
      }

      const { filename, content } = await generaPDFCarburante(user.id, dataInizio, dataFine);

      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={scarica}
      disabled={loading}
      className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
    >
      <FilePdf size={13} weight="bold" />
      {loading ? "Generazione…" : "↓ Scarica PDF"}
    </button>
  );
}
