import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ical, { ICalCalendarMethod } from "ical-generator";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const anno = parseInt(searchParams.get("anno") ?? String(new Date().getFullYear()));
  const mese = parseInt(searchParams.get("mese") ?? String(new Date().getMonth() + 1));

  const inizioMese = `${anno}-${String(mese).padStart(2, "0")}-01`;
  const fineGiorno = new Date(anno, mese, 0).getDate();
  const fineMese = `${anno}-${String(mese).padStart(2, "0")}-${fineGiorno}`;

  const { data: corse } = await supabase
    .from("corse")
    .select("id, data, ora_partenza, ora_fine, origine, destinazione, cliente_nome, tipo_servizio")
    .eq("autista_id", user.id)
    .gte("data", inizioMese)
    .lte("data", fineMese)
    .order("data")
    .order("ora_partenza");

  const calendar = ical({ name: "NoloTrack — Servizi" });
  calendar.method(ICalCalendarMethod.PUBLISH);

  for (const c of corse ?? []) {
    const [y, m, d] = c.data.split("-").map(Number);
    const [sh, sm] = c.ora_partenza.split(":").map(Number);
    const start = new Date(y, m - 1, d, sh, sm);

    let end: Date;
    if (c.ora_fine) {
      const [eh, em] = c.ora_fine.split(":").map(Number);
      end = new Date(y, m - 1, d, eh, em);
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000); // +1h default
    }

    calendar.createEvent({
      id: c.id,
      start,
      end,
      summary: c.cliente_nome
        ? `${c.cliente_nome} — ${c.origine} → ${c.destinazione}`
        : `${c.origine} → ${c.destinazione}`,
      description: c.tipo_servizio ?? undefined,
      location: c.origine,
    });
  }

  return new NextResponse(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="nolotrack-${anno}-${String(mese).padStart(2, "0")}.ics"`,
    },
  });
}
