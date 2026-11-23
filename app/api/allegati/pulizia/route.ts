import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { configR2, eliminaOggetti } from "@/lib/r2";

// Pulizia periodica dello storage (Vercel Cron, CronJob Kubernetes o curl da cron):
//  1. scarta gli allegati registrati ma mai caricati da più di 24 ore;
//  2. cancella dal bucket i file in coda (allegati eliminati, anche in cascata
//     quando si elimina una spesa, un rifornimento o una corsa).
// Protetta da `Authorization: Bearer <CRON_SECRET>`.

const LOTTO = 1000; // limite di DeleteObjects

function autorizzato(req: Request): boolean {
  const segreto = process.env.CRON_SECRET;
  if (!segreto) return false;
  const atteso = Buffer.from(`Bearer ${segreto}`);
  const ricevuto = Buffer.from(req.headers.get("authorization") ?? "");
  return atteso.length === ricevuto.length && timingSafeEqual(atteso, ricevuto);
}

async function pulizia(req: Request) {
  if (!autorizzato(req)) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  const cfg = configR2();
  const admin = createAdminClient();
  if (!cfg || !admin) {
    return NextResponse.json({ error: "R2 o SUPABASE_SERVICE_ROLE_KEY non configurati." }, { status: 503 });
  }

  const limite = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: abbandonati, error: errAbb } = await admin
    .from("allegati")
    .delete()
    .eq("caricato", false)
    .lt("created_at", limite)
    .select("id");
  if (errAbb) return NextResponse.json({ error: errAbb.message }, { status: 500 });

  let fileEliminati = 0;
  for (;;) {
    const { data: coda, error } = await admin
      .from("allegati_da_eliminare")
      .select("chiave")
      .order("created_at")
      .limit(LOTTO);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!coda?.length) break;

    const chiavi = await eliminaOggetti(cfg, coda.map((r) => r.chiave));
    if (chiavi.length) {
      await admin.from("allegati_da_eliminare").delete().in("chiave", chiavi);
      fileEliminati += chiavi.length;
    }
    // Lotto incompleto o errori su tutte le chiavi: ci riproviamo al prossimo giro
    if (coda.length < LOTTO || chiavi.length === 0) break;
  }

  return NextResponse.json({ allegatiAbbandonati: abbandonati?.length ?? 0, fileEliminati });
}

export const GET = pulizia; // Vercel Cron usa GET
export const POST = pulizia;
