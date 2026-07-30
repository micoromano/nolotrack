import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const [autistaRes] = await Promise.allSettled([
    supabase.from("autisti").select("ruolo_id, ruoli(nome)").eq("id", user.id).single(),
  ]);

  const autista = autistaRes.status === "fulfilled" ? autistaRes.value.data : null;
  const ruoliRaw = autista?.ruoli as unknown;
  const ruolo = (Array.isArray(ruoliRaw) ? (ruoliRaw[0] as { nome: string } | undefined)?.nome : (ruoliRaw as { nome: string } | null)?.nome);
  if (ruolo !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = await req.json();
  const { email, nome } = body as { email?: string; nome?: string };
  if (!email || !nome) {
    return NextResponse.json({ error: "Email e nome richiesti" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key non configurata" }, { status: 503 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: invData, error: invError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { nome },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
  });

  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 });

  if (invData.user) {
    const [ruoloRes] = await Promise.allSettled([
      adminClient.from("ruoli").select("id").eq("nome", "autista").single(),
    ]);
    const ruoloAutistaId = ruoloRes.status === "fulfilled" ? ruoloRes.value.data?.id : null;

    await adminClient.from("autisti").upsert({
      id: invData.user.id,
      nome,
      email,
      ruolo: "autista",
      ruolo_id: ruoloAutistaId ?? null,
    }, { onConflict: "id", ignoreDuplicates: true });
  }

  return NextResponse.json({ ok: true });
}
