import crypto from "crypto";

const GRAPH_VERSION = "v21.0";

function graphUrl(path: string) {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}${path}`;
}

export function whatsappConfigurato(): boolean {
  return Boolean(
    process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID
  );
}

/** Normalizza un numero italiano/internazionale al formato atteso da Meta (solo cifre, con prefisso paese, senza "+"). */
export function normalizzaNumero(numero: string): string {
  const cifre = numero.replace(/[^\d]/g, "");
  if (cifre.startsWith("00")) return cifre.slice(2);
  if (cifre.length === 10 && cifre.startsWith("3")) return `39${cifre}`; // cellulare IT senza prefisso
  return cifre;
}

interface RisultatoInvio {
  ok: boolean;
  waMessageId?: string;
  error?: string;
}

async function chiamaGraphAPI(payload: Record<string, unknown>): Promise<RisultatoInvio> {
  if (!whatsappConfigurato()) {
    return { ok: false, error: "META_WHATSAPP_TOKEN o META_WHATSAPP_PHONE_NUMBER_ID non configurati." };
  }
  try {
    const res = await fetch(graphUrl("/messages"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.error?.message ?? `Errore Meta API (HTTP ${res.status})` };
    }
    return { ok: true, waMessageId: json?.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Errore di rete verso Meta API" };
  }
}

export async function inviaTesto(to: string, corpo: string): Promise<RisultatoInvio> {
  return chiamaGraphAPI({
    to: normalizzaNumero(to),
    type: "text",
    text: { body: corpo, preview_url: false },
  });
}

export interface BottoneWA {
  id: string; // es. "step:inizio:<corsaId>" — max 256 char
  titolo: string; // max 20 caratteri visibili
}

/** Messaggio interattivo con bottoni di risposta rapida (max 3, come da limite Meta). */
export async function inviaBottoni(to: string, corpo: string, bottoni: BottoneWA[]): Promise<RisultatoInvio> {
  const bottoniValidi = bottoni.slice(0, 3);
  return chiamaGraphAPI({
    to: normalizzaNumero(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: corpo },
      action: {
        buttons: bottoniValidi.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.titolo.slice(0, 20) },
        })),
      },
    },
  });
}

export interface RigaListaWA {
  id: string;
  titolo: string;
  descrizione?: string;
}

/** Messaggio interattivo a lista, usato per la scelta forma di pagamento (più di 3 opzioni). */
export async function inviaLista(
  to: string,
  corpo: string,
  etichettaBottone: string,
  righe: RigaListaWA[]
): Promise<RisultatoInvio> {
  return chiamaGraphAPI({
    to: normalizzaNumero(to),
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: corpo },
      action: {
        button: etichettaBottone.slice(0, 20),
        sections: [
          {
            title: "Opzioni",
            rows: righe.map((r) => ({
              id: r.id,
              title: r.titolo.slice(0, 24),
              description: r.descrizione?.slice(0, 72),
            })),
          },
        ],
      },
    },
  });
}

/** Verifica la firma X-Hub-Signature-256 inviata da Meta per validare l'origine del webhook. */
export function verificaFirmaWebhook(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.META_WHATSAPP_APP_SECRET;
  if (!secret) return true; // firma non verificabile senza secret configurato (vedi banner in UI)
  if (!signatureHeader) return false;
  const atteso = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(atteso);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const REGEX_PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function estraiPlaceholder(corpo: string): string[] {
  const trovati = new Set<string>();
  for (const match of corpo.matchAll(REGEX_PLACEHOLDER)) {
    trovati.add(match[1]);
  }
  return Array.from(trovati);
}

export function riempiPlaceholder(corpo: string, valori: Record<string, string>): string {
  return corpo.replace(REGEX_PLACEHOLDER, (_match, chiave) => valori[chiave] ?? "");
}
