import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { configR2, urlUpload } from "@/lib/r2";
import {
  TABELLA_ENTITA,
  MAX_ALLEGATI_PER_VOCE,
  isEntita,
  isUuid,
  validaFile,
  pulisciNomeFile,
  chiaveOggetto,
} from "@/lib/allegati";

const NON_CONFIGURATO = { error: "Archivio file (R2) non configurato.", configurato: false };

// GET /api/allegati?entita=spesa&id=<uuid> — allegati caricati di una voce
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  if (!configR2()) return NextResponse.json(NON_CONFIGURATO, { status: 503 });

  const url = new URL(req.url);
  const entita = url.searchParams.get("entita");
  const id = url.searchParams.get("id");
  if (!isEntita(entita) || !isUuid(id)) {
    return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("allegati")
    .select("id, nome_file, content_type, dimensione, created_at")
    .eq(TABELLA_ENTITA[entita].colonna, id)
    .eq("caricato", true)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configurato: true, allegati: data ?? [] });
}

// POST /api/allegati — registra un allegato e restituisce l'URL firmato per l'upload
// body: { entita, entitaId, nomeFile, contentType, dimensione }
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const cfg = configR2();
  if (!cfg) return NextResponse.json(NON_CONFIGURATO, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const entita = body?.entita;
  const entitaId = body?.entitaId;
  const contentType = String(body?.contentType ?? "");
  const dimensione = Number(body?.dimensione);
  if (!isEntita(entita) || !isUuid(entitaId)) {
    return NextResponse.json({ error: "Voce non valida" }, { status: 400 });
  }
  const erroreFile = validaFile(contentType, dimensione);
  if (erroreFile) return NextResponse.json({ error: erroreFile }, { status: 400 });

  const { tabella, colonna } = TABELLA_ENTITA[entita];

  // La RLS garantisce che la voce sia dell'utente: se non la vede, non esiste.
  const { data: voce } = await supabase.from(tabella).select("id").eq("id", entitaId).maybeSingle();
  if (!voce) return NextResponse.json({ error: "Voce non trovata" }, { status: 404 });

  const { count } = await supabase
    .from("allegati")
    .select("id", { count: "exact", head: true })
    .eq(colonna, entitaId);
  if ((count ?? 0) >= MAX_ALLEGATI_PER_VOCE) {
    return NextResponse.json(
      { error: `Massimo ${MAX_ALLEGATI_PER_VOCE} allegati per voce.` },
      { status: 409 },
    );
  }

  const id = crypto.randomUUID();
  const chiave = chiaveOggetto(user.id, entita, id, contentType);
  const { error } = await supabase.from("allegati").insert({
    id,
    autista_id: user.id,
    [colonna]: entitaId,
    chiave,
    nome_file: pulisciNomeFile(String(body?.nomeFile ?? "")),
    content_type: contentType,
    dimensione,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const uploadUrl = await urlUpload(cfg, chiave, contentType, dimensione);
  return NextResponse.json({ id, uploadUrl }, { status: 201 });
}
