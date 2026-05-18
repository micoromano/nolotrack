import { createClient } from "@/lib/supabase/server";
import { AgendaNav, IcalButton, GoogleCalendarButton } from "./client";
import { cn } from "@/lib/utils";

const pagamentoBadgeStyle: Record<string, string> = {
  cash: "bg-amber-400/10 text-amber-400",
  carta: "bg-blue-400/10 text-blue-400",
  uber: "bg-muted text-muted-foreground",
  noninc: "bg-purple-400/10 text-purple-400",
};

const pagamentoLabel: Record<string, string> = {
  cash: "Cash", carta: "Carta", uber: "Uber", noninc: "No Inc",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ anno?: string; mese?: string }>;
}) {
  const { anno: annoStr, mese: meseStr } = await searchParams;
  const oggi = new Date();
  const anno = annoStr ? parseInt(annoStr) : oggi.getFullYear();
  const mese = meseStr ? parseInt(meseStr) : oggi.getMonth() + 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const inizioMese = `${anno}-${String(mese).padStart(2, "0")}-01`;
  const fineGiorno = new Date(anno, mese, 0).getDate();
  const fineMese = `${anno}-${String(mese).padStart(2, "0")}-${fineGiorno}`;

  const [corsRes, integrazioneRes] = await Promise.allSettled([
    supabase
      .from("corse")
      .select("id, data, ora_partenza, ora_fine, origine, destinazione, tipo_pagamento, importo, cliente_nome, n_pax, tipo_servizio")
      .eq("autista_id", user!.id)
      .gte("data", inizioMese)
      .lte("data", fineMese)
      .order("ora_partenza"),
    supabase
      .from("integrazioni")
      .select("id")
      .eq("autista_id", user!.id)
      .eq("provider", "google_calendar")
      .maybeSingle(),
  ]);

  const corse = corsRes.status === "fulfilled" ? corsRes.value.data ?? [] : [];
  const integrazioneConnessa =
    integrazioneRes.status === "fulfilled" && integrazioneRes.value.data != null;

  // Raggruppa per giorno
  const corsePerGiorno = new Map<string, typeof corse>();
  for (const c of corse) {
    if (!corsePerGiorno.has(c.data)) corsePerGiorno.set(c.data, []);
    corsePerGiorno.get(c.data)!.push(c);
  }

  // Genera tutti i giorni del mese
  const giorni: Date[] = [];
  for (let g = 1; g <= fineGiorno; g++) {
    giorni.push(new Date(anno, mese - 1, g));
  }

  const oggiStr = oggi.toISOString().split("T")[0];

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-foreground">Agenda</h1>
          <AgendaNav anno={anno} mese={mese} />
        </div>
        <div className="flex items-center gap-2">
          <IcalButton anno={anno} mese={mese} />
          {!integrazioneConnessa && <GoogleCalendarButton />}
          {integrazioneConnessa && (
            <span className="text-xs text-green-400 border border-green-400/30 rounded px-2 py-1">
              Google Calendar connesso
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-2 max-w-2xl">
        {giorni.map((giorno) => {
          const dataStr = giorno.toISOString().split("T")[0];
          const corseGiorno = corsePerGiorno.get(dataStr) ?? [];
          const isOggi = dataStr === oggiStr;
          const haServizi = corseGiorno.length > 0;

          if (!haServizi) {
            return (
              <div key={dataStr} className={cn(
                "flex items-center gap-3 px-4 py-2 rounded text-xs text-muted-foreground/50",
                isOggi && "bg-primary/5 text-primary font-medium"
              )}>
                <span className="w-20 shrink-0 capitalize">
                  {giorno.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" })}
                </span>
                {isOggi && <span className="text-xs text-primary">Oggi — nessun servizio</span>}
              </div>
            );
          }

          return (
            <div key={dataStr} className={cn(
              "bg-card border border-border rounded-lg overflow-hidden",
              isOggi && "border-primary/40"
            )}>
              {/* Header giorno */}
              <div className={cn(
                "flex items-center justify-between px-4 py-2 border-b border-border",
                isOggi ? "bg-primary/10" : "bg-muted/20"
              )}>
                <span className={cn(
                  "text-sm font-semibold capitalize",
                  isOggi ? "text-primary" : "text-foreground"
                )}>
                  {giorno.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                  {isOggi && <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Oggi</span>}
                </span>
                <span className="text-xs text-muted-foreground">{corseGiorno.length} serviz{corseGiorno.length === 1 ? "io" : "i"}</span>
              </div>

              {/* Servizi del giorno */}
              <div className="divide-y divide-border">
                {corseGiorno.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-start gap-4">
                    <div className="font-mono text-sm text-muted-foreground shrink-0 w-20">
                      {c.ora_partenza.slice(0, 5)}
                      {c.ora_fine && <><br /><span className="text-xs">→ {c.ora_fine.slice(0, 5)}</span></>}
                    </div>
                    <div className="flex-1 min-w-0">
                      {c.cliente_nome && (
                        <p className="text-sm font-medium text-foreground">{c.cliente_nome}
                          {c.n_pax && c.n_pax > 1 && <span className="ml-2 text-xs text-muted-foreground">{c.n_pax} pax</span>}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{c.origine} → {c.destinazione}</p>
                      {c.tipo_servizio && <p className="text-xs text-muted-foreground/60">{c.tipo_servizio}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", pagamentoBadgeStyle[c.tipo_pagamento])}>
                        {pagamentoLabel[c.tipo_pagamento]}
                      </span>
                      <span className="font-mono text-xs">
                        {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(c.importo)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
