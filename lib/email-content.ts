import { createClient } from "@/lib/supabase/client";

export type TipoDocumento = "rapportino" | "stipendio" | "carburante";

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function dataitIT(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const SEP = "━".repeat(30);

// ─────────────────────────────────────────────────────
// Rapportino — un giorno alla volta (da → a per ogni giorno del range)
// ─────────────────────────────────────────────────────
async function rapportinoRange(supabase: ReturnType<typeof createClient>, userId: string, dataInizio: string, dataFine: string): Promise<string> {
  // Enumera i giorni nel range
  const giorni: string[] = [];
  const cur = new Date(dataInizio + "T00:00:00");
  const end = new Date(dataFine + "T00:00:00");
  while (cur <= end) {
    giorni.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }

  const sezioni: string[] = [];

  for (const giorno of giorni) {
    const [turnoRes, corseRes, speseRes] = await Promise.allSettled([
      supabase.from("turni").select("*").eq("autista_id", userId).eq("data", giorno).maybeSingle(),
      supabase.from("corse").select("*").eq("autista_id", userId).eq("data", giorno).order("ora_partenza"),
      supabase.from("spese").select("*").eq("autista_id", userId).eq("data", giorno),
    ]);

    const turno = turnoRes.status === "fulfilled" ? turnoRes.value.data : null;
    const corse = corseRes.status === "fulfilled" ? (corseRes.value.data ?? []) : [];
    const spese = speseRes.status === "fulfilled" ? (speseRes.value.data ?? []) : [];

    if (!turno && corse.length === 0 && spese.length === 0) continue;

    const totCash = corse.filter((c: { tipo_pagamento: string; importo: number }) => c.tipo_pagamento === "cash").reduce((s: number, c: { importo: number }) => s + c.importo, 0);
    const totCarte = corse.filter((c: { tipo_pagamento: string; importo: number }) => c.tipo_pagamento === "carta").reduce((s: number, c: { importo: number }) => s + c.importo, 0);
    const totUber = corse.filter((c: { tipo_pagamento: string; importo: number }) => c.tipo_pagamento === "uber").reduce((s: number, c: { importo: number }) => s + c.importo, 0);
    const totSpese = spese.reduce((s: number, sp: { importo: number }) => s + sp.importo, 0);

    let blocco = `RAPPORTINO — ${dataitIT(giorno)}\n${SEP}\n`;
    if (turno) {
      blocco += `Turno: ${turno.ora_inizio.slice(0, 5)} → ${turno.ora_fine.slice(0, 5)} (${formatOre(turno.ore_lavorate)})\n`;
    } else {
      blocco += `Turno: non registrato\n`;
    }
    blocco += `Corse: ${corse.length}\n`;
    blocco += `Cash: ${euro(totCash)} | Carte: ${euro(totCarte)} | Uber: ${euro(totUber)}\n`;
    blocco += `Spese: ${euro(totSpese)}\n`;

    sezioni.push(blocco);
  }

  if (sezioni.length === 0) return "Nessun dato trovato per il periodo selezionato.";
  return sezioni.join("\n\n");
}

// ─────────────────────────────────────────────────────
// Stipendio mensile (placeholder — sezione in costruzione)
// ─────────────────────────────────────────────────────
async function stipendioRange(supabase: ReturnType<typeof createClient>, userId: string, dataInizio: string, dataFine: string): Promise<string> {
  const [corseRes, turniRes] = await Promise.allSettled([
    supabase.from("corse").select("*").eq("autista_id", userId).gte("data", dataInizio).lte("data", dataFine),
    supabase.from("turni").select("*").eq("autista_id", userId).gte("data", dataInizio).lte("data", dataFine),
  ]);

  const corse = corseRes.status === "fulfilled" ? (corseRes.value.data ?? []) : [];
  const turni = turniRes.status === "fulfilled" ? (turniRes.value.data ?? []) : [];

  const totCash = corse.filter((c: { tipo_pagamento: string; importo: number }) => c.tipo_pagamento === "cash").reduce((s: number, c: { importo: number }) => s + c.importo, 0);
  const totCarte = corse.filter((c: { tipo_pagamento: string; importo: number }) => c.tipo_pagamento === "carta").reduce((s: number, c: { importo: number }) => s + c.importo, 0);
  const totUber = corse.filter((c: { tipo_pagamento: string; importo: number }) => c.tipo_pagamento === "uber").reduce((s: number, c: { importo: number }) => s + c.importo, 0);
  const orelavorate = turni.reduce((s: number, t: { ore_lavorate: number }) => s + t.ore_lavorate, 0);

  return (
    `RIEPILOGO STIPENDIO — ${dataitIT(dataInizio)} / ${dataitIT(dataFine)}\n${SEP}\n` +
    `Giorni lavorati: ${turni.length}\n` +
    `Ore totali: ${formatOre(orelavorate)}\n` +
    `Corse totali: ${corse.length}\n` +
    `Incasso cash: ${euro(totCash)}\n` +
    `Incasso carte: ${euro(totCarte)}\n` +
    `Incasso Uber: ${euro(totUber)}\n` +
    `Incasso totale: ${euro(totCash + totCarte + totUber)}\n` +
    `\n(Calcolo busta paga dettagliato disponibile nella sezione Stipendio dell'app.)`
  );
}

// ─────────────────────────────────────────────────────
// Registro carburante
// ─────────────────────────────────────────────────────
async function carburanteRange(supabase: ReturnType<typeof createClient>, userId: string, dataInizio: string, dataFine: string): Promise<string> {
  const { data, error } = await supabase
    .from("carburante")
    .select("*")
    .eq("autista_id", userId)
    .gte("data", dataInizio)
    .lte("data", dataFine)
    .order("data");

  if (error || !data || data.length === 0) {
    return `REGISTRO CARBURANTE — ${dataitIT(dataInizio)} / ${dataitIT(dataFine)}\n${SEP}\nNessun rifornimento registrato.`;
  }

  const totCosto = data.reduce((s: number, r: { importo: number }) => s + r.importo, 0);
  const totLitri = data.reduce((s: number, r: { litri?: number }) => s + (r.litri ?? 0), 0);

  let testo = `REGISTRO CARBURANTE — ${dataitIT(dataInizio)} / ${dataitIT(dataFine)}\n${SEP}\n`;
  testo += `Rifornimenti: ${data.length}\n`;
  if (totLitri > 0) testo += `Litri totali: ${totLitri.toFixed(2)} L\n`;
  testo += `Costo totale: ${euro(totCosto)}\n\n`;

  testo += "Data          Litri      Importo    Note\n";
  testo += "─".repeat(46) + "\n";
  for (const r of data) {
    const d = dataitIT(r.data).padEnd(14);
    const l = r.litri != null ? `${r.litri.toFixed(2)} L`.padEnd(11) : "–".padEnd(11);
    const imp = euro(r.importo).padEnd(11);
    const nota = r.note ?? "";
    testo += `${d}${l}${imp}${nota}\n`;
  }

  return testo;
}

// ─────────────────────────────────────────────────────
// Entry point pubblico
// ─────────────────────────────────────────────────────
export async function generaContenutoEmail(
  tipo: TipoDocumento,
  dataInizio: string,
  dataFine: string
): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "Errore: utente non autenticato.";

  switch (tipo) {
    case "rapportino":
      return rapportinoRange(supabase, user.id, dataInizio, dataFine);
    case "stipendio":
      return stipendioRange(supabase, user.id, dataInizio, dataFine);
    case "carburante":
      return carburanteRange(supabase, user.id, dataInizio, dataFine);
  }
}
