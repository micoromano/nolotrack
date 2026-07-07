import { createClient } from "@/lib/supabase/server";
import { whatsappConfigurato } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    configurato: whatsappConfigurato(),
    firmaVerificabile: Boolean(process.env.META_WHATSAPP_APP_SECRET),
    callbackUrl: `${origin}/api/whatsapp/webhook`,
  });
}
