import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .eq("autista_id", user.id)
    .order("categoria")
    .order("nome");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { nome, categoria, corpo } = await req.json();
  if (!nome || !categoria || !corpo) {
    return NextResponse.json({ error: "Campi obbligatori: nome, categoria, corpo" }, { status: 400 });
  }
  if (!["autista", "cliente", "libero"].includes(categoria)) {
    return NextResponse.json({ error: "Categoria non valida" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("whatsapp_templates")
    .insert({ autista_id: user.id, nome, categoria, corpo })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}
