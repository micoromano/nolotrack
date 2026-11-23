import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { configR2, urlDownload, eliminaOggetti } from "@/lib/r2";
import { isUuid } from "@/lib/allegati";

// GET /api/allegati/:id — reindirizza a un URL firmato temporaneo.
// ?download=1 forza il download, altrimenti il file si apre nel browser.
export async function GET(req: Request, ctx: RouteContext<"/api/allegati/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Id non valido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const cfg = configR2();
  if (!cfg) return NextResponse.json({ error: "Archivio file (R2) non configurato." }, { status: 503 });

  const { data: allegato } = await supabase
    .from("allegati")
    .select("chiave, nome_file")
    .eq("id", id)
    .eq("caricato", true)
    .maybeSingle();
  if (!allegato) return NextResponse.json({ error: "Allegato non trovato" }, { status: 404 });

  const download = new URL(req.url).searchParams.get("download") === "1";
  const url = await urlDownload(cfg, allegato.chiave, allegato.nome_file, !download);
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

// DELETE /api/allegati/:id — elimina allegato e file
export async function DELETE(_req: Request, ctx: RouteContext<"/api/allegati/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Id non valido" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: eliminati, error } = await supabase
    .from("allegati")
    .delete()
    .eq("id", id)
    .select("chiave");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!eliminati?.length) return NextResponse.json({ error: "Allegato non trovato" }, { status: 404 });

  // Il trigger ha messo la chiave in coda: proviamo a cancellare subito il file.
  // Se fallisce ci pensa /api/allegati/pulizia.
  const cfg = configR2();
  const admin = createAdminClient();
  if (cfg) {
    try {
      const chiavi = await eliminaOggetti(cfg, eliminati.map((a) => a.chiave));
      if (admin && chiavi.length) await admin.from("allegati_da_eliminare").delete().in("chiave", chiavi);
    } catch (e) {
      console.error("[allegati] eliminazione file rinviata:", e);
    }
  }
  return NextResponse.json({ ok: true });
}
