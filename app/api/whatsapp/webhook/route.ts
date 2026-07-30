import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient, SupabaseClient } from "@supabase/supabase-js";
import { verificaFirmaWebhook, inviaBottoni, inviaLista, inviaTesto } from "@/lib/whatsapp";
import type { TipoPagamento } from "@/types";

function adminClient(): SupabaseClient {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─────────────────────────────────────────────────────
// GET — verifica webhook richiesta da Meta in fase di configurazione
// ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === process.env.META_WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─────────────────────────────────────────────────────
// POST — eventi in arrivo: messaggi (bottoni/testo) e ricevute di stato
// ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verificaFirmaWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Firma non valida" }, { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const supabase = adminClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      for (const msg of value.messages ?? []) {
        await gestisciMessaggioInbound(supabase, msg).catch((err) =>
          console.error("Errore gestione messaggio WhatsApp:", err)
        );
      }
      for (const status of value.statuses ?? []) {
        await gestisciStatus(supabase, status).catch((err) =>
          console.error("Errore gestione stato WhatsApp:", err)
        );
      }
    }
  }

  // Meta richiede una risposta 200 rapida indipendentemente dall'esito interno
  return NextResponse.json({ ok: true });
}

// ─────────────────────────────────────────────────────
// Tipi payload Meta (sottoinsieme minimo usato)
// ─────────────────────────────────────────────────────
interface MetaWebhookPayload {
  entry?: {
    changes?: {
      value: {
        messages?: MetaMessage[];
        statuses?: MetaStatus[];
      };
    }[];
  }[];
}

interface MetaMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

interface MetaStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
}

// ─────────────────────────────────────────────────────
// Gestione ricevute di stato (consegnato / letto / errore)
// ─────────────────────────────────────────────────────
async function gestisciStatus(supabase: SupabaseClient, status: MetaStatus) {
  const mappaStato: Record<string, string> = {
    sent: "inviato",
    delivered: "consegnato",
    read: "letto",
    failed: "errore",
  };
  const stato = mappaStato[status.status];
  if (!stato) return;
  await supabase.from("whatsapp_log").update({ stato }).eq("wa_message_id", status.id);
}

// ─────────────────────────────────────────────────────
// Gestione messaggi in arrivo (click bottoni/lista o testo libero)
// ─────────────────────────────────────────────────────
async function gestisciMessaggioInbound(supabase: SupabaseClient, msg: MetaMessage) {
  const reply = msg.interactive?.button_reply ?? msg.interactive?.list_reply;

  if (reply) {
    await logInbound(supabase, msg.from, "bottone_click", reply.title, msg.id);
    await gestisciClickBottone(supabase, msg.from, reply.id);
    return;
  }

  if (msg.type === "text" && msg.text) {
    await logInbound(supabase, msg.from, "testo", msg.text.body, msg.id);
  }
}

async function logInbound(
  supabase: SupabaseClient,
  telefono: string,
  tipo: "bottone_click" | "testo",
  contenuto: string,
  waMessageId: string
) {
  await supabase.from("whatsapp_log").insert({
    telefono,
    direzione: "in",
    tipo,
    contenuto,
    wa_message_id: waMessageId,
    stato: "ricevuto",
  });
}

const LABEL_PAGAMENTO: Record<TipoPagamento, string> = {
  cash: "Cash",
  carta: "Carta",
  uber: "Uber",
  noninc: "Non incassato",
};

// ─────────────────────────────────────────────────────
// Macchina a stati del servizio, guidata dagli id dei bottoni:
// "step:inizio:<corsaId>" | "step:fine_corsa:<corsaId>" | "step:fine_servizio:<corsaId>"
// "pagamento:<cash|carta|uber|noninc>:<corsaId>"
// ─────────────────────────────────────────────────────
async function gestisciClickBottone(supabase: SupabaseClient, from: string, buttonId: string) {
  const parti = buttonId.split(":");
  if (parti.length !== 3) return;
  const [ambito, valore, corsaId] = parti;

  const { data: corsa } = await supabase.from("corse").select("*").eq("id", corsaId).maybeSingle();
  if (!corsa) return;

  if (ambito === "step" && valore === "inizio") {
    await supabase.from("corse").update({ stato_servizio: "in_corso" }).eq("id", corsaId);
    const invio = await inviaBottoni(from, "Corsa iniziata ✅\nQuando hai terminato la corsa, comunicalo qui sotto:", [
      { id: `step:fine_corsa:${corsaId}`, titolo: "🏁 Fine corsa" },
    ]);
    await logOutbound(supabase, corsa.autista_id, corsaId, "autista", from, "interactive_bottoni", "Fine corsa?", invio);

    if (corsa.cliente_tel) {
      const testoCliente = `Buongiorno${corsa.cliente_nome ? " " + corsa.cliente_nome : ""}, il Suo autista NCC è in arrivo per il servizio ${corsa.origine} → ${corsa.destinazione}.`;
      const invioCliente = await inviaTesto(corsa.cliente_tel, testoCliente);
      await logOutbound(supabase, corsa.autista_id, corsaId, "cliente", corsa.cliente_tel, "testo", testoCliente, invioCliente);
    }
    return;
  }

  if (ambito === "step" && valore === "fine_corsa") {
    await supabase.from("corse").update({ stato_servizio: "attesa_pagamento" }).eq("id", corsaId);
    const invio = await inviaLista(from, "Corsa terminata 🏁\nCome è stato effettuato il pagamento?", "Scegli", [
      { id: `pagamento:cash:${corsaId}`, titolo: "💶 Cash" },
      { id: `pagamento:carta:${corsaId}`, titolo: "💳 Carta" },
      { id: `pagamento:uber:${corsaId}`, titolo: "📱 Uber" },
      { id: `pagamento:noninc:${corsaId}`, titolo: "🚫 Non incassato" },
    ]);
    await logOutbound(supabase, corsa.autista_id, corsaId, "autista", from, "interactive_lista", "Forma di pagamento?", invio);
    return;
  }

  if (ambito === "pagamento") {
    const tipoPagamento = valore as TipoPagamento;
    if (!(tipoPagamento in LABEL_PAGAMENTO)) return;
    await supabase.from("corse").update({ tipo_pagamento: tipoPagamento, stato_servizio: "pagato" }).eq("id", corsaId);
    const invio = await inviaBottoni(from, `Pagamento registrato: ${LABEL_PAGAMENTO[tipoPagamento]} ✅\nConcludi il servizio quando pronto:`, [
      { id: `step:fine_servizio:${corsaId}`, titolo: "✅ Fine servizio" },
    ]);
    await logOutbound(supabase, corsa.autista_id, corsaId, "autista", from, "interactive_bottoni", "Fine servizio?", invio);
    return;
  }

  if (ambito === "step" && valore === "fine_servizio") {
    await supabase.from("corse").update({ stato_servizio: "completato" }).eq("id", corsaId);
    const invio = await inviaTesto(from, "Servizio completato. Ottimo lavoro! 👏");
    await logOutbound(supabase, corsa.autista_id, corsaId, "autista", from, "testo", "Servizio completato.", invio);

    if (corsa.cliente_tel) {
      const testoCliente = `Il servizio è terminato. Grazie per aver viaggiato con noi${corsa.cliente_nome ? ", " + corsa.cliente_nome : ""}!`;
      const invioCliente = await inviaTesto(corsa.cliente_tel, testoCliente);
      await logOutbound(supabase, corsa.autista_id, corsaId, "cliente", corsa.cliente_tel, "testo", testoCliente, invioCliente);
    }
  }
}

async function logOutbound(
  supabase: SupabaseClient,
  autistaId: string,
  corsaId: string,
  destinatarioTipo: "autista" | "cliente",
  telefono: string,
  tipo: "testo" | "interactive_bottoni" | "interactive_lista",
  contenuto: string,
  invio: { ok: boolean; waMessageId?: string; error?: string }
) {
  await supabase.from("whatsapp_log").insert({
    autista_id: autistaId,
    corsa_id: corsaId,
    destinatario_tipo: destinatarioTipo,
    telefono,
    direzione: "out",
    tipo,
    contenuto,
    wa_message_id: invio.waMessageId,
    stato: invio.ok ? "inviato" : "errore",
    errore_msg: invio.ok ? null : invio.error,
  });
}
