import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { originRichiesta } from "@/lib/request-origin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = originRichiesta(request);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
