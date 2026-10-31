import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { originRichiesta } from "@/lib/request-origin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const origin = originRichiesta(req);
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/dashboard/agenda?errore=no_code", origin));

  const redirectUri = `${origin}/api/google-calendar/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const { tokens } = await oauth2Client.getToken(code);

  await supabase.from("integrazioni").upsert({
    autista_id: user.id,
    provider: "google_calendar",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
  }, { onConflict: "autista_id,provider" });

  return NextResponse.redirect(new URL("/dashboard/agenda?connesso=google", origin));
}
