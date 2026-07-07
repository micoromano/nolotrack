import { createClient } from "@/lib/supabase/server";
import { inviaBottoni, inviaTesto, riempiPlaceholder, whatsappConfigurato } from "@/lib/whatsapp";
import { NextResponse } from "next/server";
import type { DestinatarioTipoWA, TipoMessaggioWA } from "@/types";

// Rate limiter semplice in-memory (stesso pattern di /api/invia-email)
const rateLimit = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(userId);
  if (!entry || now > entry.reset) {
    rateLimit.set(userId, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

interface BodyInvio {
  azione: "avvia_flusso_autista" | "messaggio_libero" | "usa_template";
  telefono: string;
  corsaId?: string;
  testo?: string;
  destinatarioTipo?: DestinatarioTipoWA;
  templateId?: string;
  valori?: Record<string, string>;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Troppe richieste. Attendi un minuto." }, { status: 429 });
  }

  if (!whatsappConfigurato()) {
    return NextResponse.json(
      { error: "Meta WhatsApp non configurato. Imposta META_WHATSAPP_TOKEN e META_WHATSAPP_PHONE_NUMBER_ID in .env.local." },
      { status: 503 }
    );
  }

  let body: BodyInvio;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  if (!body.telefono) {
    return NextResponse.json({ error: "Numero di telefono mancante" }, { status: 400 });
  }

  if (body.azione === "avvia_flusso_autista") {
    if (!body.corsaId) return NextResponse.json({ error: "corsaId richiesto" }, { status: 400 });

    const { data: corsa, error: corsaErr } = await supabase
      .from("corse")
      .select("*")
      .eq("id", body.corsaId)
      .eq("autista_id", user.id)
      .single();

    if (corsaErr || !corsa) return NextResponse.json({ error: "Corsa non trovata" }, { status: 404 });

    await supabase.from("corse").update({ stato_servizio: "da_iniziare" }).eq("id", corsa.id);
    await supabase.from("autisti").update({ telefono: body.telefono }).eq("id", user.id);

    const corpo =
      `Nuovo servizio 🚘\n${corsa.origine} → ${corsa.destinazione}\nOra: ${corsa.ora_partenza.slice(0, 5)}` +
      (corsa.cliente_nome ? `\nCliente: ${corsa.cliente_nome}` : "") +
      `\n\nComunica l'inizio quando parti:`;

    const invio = await inviaBottoni(body.telefono, corpo, [
      { id: `step:inizio:${corsa.id}`, titolo: "▶️ Inizio corsa" },
    ]);

    await registraLog(supabase, {
      autistaId: user.id,
      corsaId: corsa.id,
      destinatarioTipo: "autista",
      telefono: body.telefono,
      tipo: "interactive_bottoni",
      contenuto: corpo,
      invio,
    });

    if (!invio.ok) return NextResponse.json({ error: invio.error }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  if (body.azione === "messaggio_libero") {
    if (!body.testo) return NextResponse.json({ error: "testo richiesto" }, { status: 400 });

    const invio = await inviaTesto(body.telefono, body.testo);

    await registraLog(supabase, {
      autistaId: user.id,
      corsaId: body.corsaId ?? null,
      destinatarioTipo: body.destinatarioTipo ?? null,
      telefono: body.telefono,
      tipo: "testo",
      contenuto: body.testo,
      invio,
    });

    if (!invio.ok) return NextResponse.json({ error: invio.error }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  if (body.azione === "usa_template") {
    if (!body.templateId) return NextResponse.json({ error: "templateId richiesto" }, { status: 400 });

    const { data: template, error: templateErr } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("id", body.templateId)
      .eq("autista_id", user.id)
      .single();

    if (templateErr || !template) return NextResponse.json({ error: "Template non trovato" }, { status: 404 });

    const testo = riempiPlaceholder(template.corpo, body.valori ?? {});
    const invio = await inviaTesto(body.telefono, testo);

    await registraLog(supabase, {
      autistaId: user.id,
      corsaId: body.corsaId ?? null,
      destinatarioTipo: body.destinatarioTipo ?? null,
      telefono: body.telefono,
      tipo: "template",
      contenuto: testo,
      invio,
    });

    if (!invio.ok) return NextResponse.json({ error: invio.error }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Azione non riconosciuta" }, { status: 400 });
}

async function registraLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    autistaId: string;
    corsaId: string | null;
    destinatarioTipo: DestinatarioTipoWA | null;
    telefono: string;
    tipo: TipoMessaggioWA;
    contenuto: string;
    invio: { ok: boolean; waMessageId?: string; error?: string };
  }
) {
  await supabase.from("whatsapp_log").insert({
    autista_id: params.autistaId,
    corsa_id: params.corsaId,
    destinatario_tipo: params.destinatarioTipo,
    telefono: params.telefono,
    direzione: "out",
    tipo: params.tipo,
    contenuto: params.contenuto,
    wa_message_id: params.invio.waMessageId,
    stato: params.invio.ok ? "inviato" : "errore",
    errore_msg: params.invio.ok ? null : params.invio.error,
  });
}
