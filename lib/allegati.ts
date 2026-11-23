// Regole condivise (client e server) per gli allegati salvati su R2.

export const ENTITA_ALLEGATI = ["spesa", "carburante", "corsa"] as const;
export type EntitaAllegato = (typeof ENTITA_ALLEGATI)[number];

/** Tabella della voce e colonna di `allegati` che la referenzia. */
export const TABELLA_ENTITA: Record<EntitaAllegato, { tabella: string; colonna: string }> = {
  spesa: { tabella: "spese", colonna: "spesa_id" },
  carburante: { tabella: "carburante", colonna: "carburante_id" },
  corsa: { tabella: "corse", colonna: "corsa_id" },
};

export const DIMENSIONE_MAX = 10 * 1024 * 1024; // 10 MB
export const MAX_ALLEGATI_PER_VOCE = 10;

/** Tipi ammessi → estensione usata nella chiave del bucket. */
export const TIPI_AMMESSI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

export const ACCEPT_INPUT = Object.keys(TIPI_AMMESSI).join(",");

export interface Allegato {
  id: string;
  nome_file: string;
  content_type: string;
  dimensione: number;
  created_at: string;
}

export function isEntita(v: unknown): v is EntitaAllegato {
  return typeof v === "string" && (ENTITA_ALLEGATI as readonly string[]).includes(v);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Errore leggibile se il file non è accettabile, altrimenti null. */
export function validaFile(contentType: string, dimensione: number): string | null {
  if (!(contentType in TIPI_AMMESSI)) return "Formato non supportato: usa JPG, PNG, WEBP, HEIC o PDF.";
  if (!Number.isInteger(dimensione) || dimensione <= 0) return "File vuoto.";
  if (dimensione > DIMENSIONE_MAX) return `File troppo grande (max ${DIMENSIONE_MAX / 1024 / 1024} MB).`;
  return null;
}

/** Nome file ripulito da percorsi e caratteri di controllo, max 120 caratteri. */
export function pulisciNomeFile(nome: string): string {
  const base = nome.split(/[\\/]/).pop() ?? "";
  const pulito = base.replace(/[\u0000-\u001f\u007f"]/g, "").trim();
  return (pulito || "allegato").slice(0, 120);
}

/**
 * Chiave dell'oggetto nel bucket. Non contiene il nome originale del file
 * (niente dati personali negli URL) ed è unica grazie all'id dell'allegato.
 */
export function chiaveOggetto(
  autistaId: string,
  entita: EntitaAllegato,
  allegatoId: string,
  contentType: string,
): string {
  return `allegati/${autistaId}/${entita}/${allegatoId}.${TIPI_AMMESSI[contentType]}`;
}

export function formatDimensione(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${(byte / 1024).toFixed(0)} KB`;
  return `${(byte / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
