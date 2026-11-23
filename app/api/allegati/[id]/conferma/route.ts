import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { configR2, infoOggetto } from "@/lib/r2";
import { isUuid } from "@/lib/allegati";

// POST /api/allegati/:id/conferma — dopo l'upload: verifica che il file sia nel
// bucket con la dimensione dichiarata e rende visibile l'allegato.
export async function POST(_req: Request, ctx: RouteContext<"/api/allegati/[id]/conferma">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Id non valido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const cfg = configR2();
  if (!cfg) return NextResponse.json({ error: "Archivio file (R2) non configurato." }, { status: 503 });

  const { data: allegato } = await supabase
    .from("allegati")
    .select("id, chiave, dimensione, nome_file, content_type, created_at, caricato")
    .eq("id", id)
    .maybeSingle();
  if (!allegato) return NextResponse.json({ error: "Allegato non trovato" }, { status: 404 });

  const info = await infoOggetto(cfg, allegato.chiave);
  if (!info) return NextResponse.json({ error: "Il file non risulta caricato." }, { status: 409 });
  if (info.dimensione !== Number(allegato.dimensione) || info.contentType !== allegato.content_type) {
    // Upload diverso da quello dichiarato: scarta l'allegato (il trigger accoda il file).
    await supabase.from("allegati").delete().eq("id", id);
    return NextResponse.json({ error: "Il file caricato non corrisponde." }, { status: 422 });
  }

  if (!allegato.caricato) {
    const { error } = await supabase.from("allegati").update({ caricato: true }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { id: aid, nome_file, content_type, dimensione, created_at } = allegato;
  return NextResponse.json({ allegato: { id: aid, nome_file, content_type, dimensione, created_at } });
}
