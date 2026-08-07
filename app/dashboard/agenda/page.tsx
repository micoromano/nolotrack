import { createClient } from "@/lib/supabase/server";
import { AgendaNav, IcalButton, GoogleCalendarButton } from "./client";
import { cn } from "@/lib/utils";
import { getServerLocale } from "@/lib/locale";
import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";

const pagamentoBadgeStyle: Record<string, string> = {
  cash: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  carta: "bg-blue-400/10 text-blue-400 border border-blue-400/20",
  uber: "bg-slate-400/10 text-slate-400 border border-slate-400/20",
  noninc: "bg-purple-400/10 text-purple-400 border border-purple-400/20",
};

const pagamentoBorderStyle: Record<string, string> = {
  cash: "border-amber-400 bg-amber-400/10",
  carta: "border-blue-400 bg-blue-400/10",
  uber: "border-slate-400 bg-slate-400/10",
  noninc: "border-purple-400 bg-purple-400/10",
};

const pagamentoLabel: Record<string, string> = {
  cash: "Cash", carta: "Carta", uber: "Uber", noninc: "No Inc",
};

const pagamentoSwatch: Record<string, string> = {
  cash: "bg-amber-400", carta: "bg-blue-400", uber: "bg-slate-400", noninc: "bg-purple-400",
};

function euro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ anno?: string; mese?: string }>;
}) {
  const { anno: annoStr, mese: meseStr } = await searchParams;
  const locale = await getServerLocale();
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

  // Metriche derivate dal mese caricato
  const totServizi = corse.length;
  const totIncasso = corse.reduce((s, c) => s + (c.tipo_pagamento !== "noninc" ? c.importo : 0), 0);
  const giorniConServizi = corsePerGiorno.size;
  const giorniLiberi = giorni.length - giorniConServizi;

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div className="flex items-center gap-4">
          <h1 className="font-heading text-lg font-bold text-primary">Agenda</h1>
          <AgendaNav anno={anno} mese={mese} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AgendaNav anno={anno} mese={mese} />
          <IcalButton anno={anno} mese={mese} />
          {!integrazioneConnessa && <GoogleCalendarButton />}
          {integrazioneConnessa && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-success-emerald border border-success-emerald/30 bg-success-emerald/10 rounded-lg px-3 py-1.5">
              <CalendarCheck size={13} weight="fill" />
              Google Calendar connesso
            </span>
          )}
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 space-y-2 max-w-2xl">
        {giorni.map((giorno) => {
          const dataStr = giorno.toISOString().split("T")[0];
          const corseGiorno = corsePerGiorno.get(dataStr) ?? [];
          const isOggi = dataStr === oggiStr;
          const haServizi = corseGiorno.length > 0;

          if (!haServizi) {
            return (
              <div key={dataStr} className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-on-surface-variant/50",
                isOggi && "bg-primary/5 text-primary font-medium"
              )}>
                <span className="w-20 shrink-0 capitalize">
                  {giorno.toLocaleDateString(locale, { weekday: "short", day: "numeric" })}
                </span>
                {isOggi && <span className="text-xs text-primary">Oggi — nessun servizio</span>}
              </div>
            );
          }

          return (
            <div key={dataStr} className={cn(
              "glass-card rounded-2xl overflow-hidden",
              isOggi && "border-primary/40"
            )}>
              {/* Header giorno */}
              <div className={cn(
                "flex items-center justify-between px-4 py-3 border-b border-border-subtle",
                isOggi ? "bg-primary/10" : "bg-surface-container-low/50"
              )}>
                <div className="flex items-center gap-3">
                  {giorno.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                  {isOggi && <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-lg">Oggi</span>}
                </div>
                <span className="text-xs text-on-surface-variant">{corseGiorno.length} serviz{corseGiorno.length === 1 ? "io" : "i"}</span>
              </div>

              {/* Servizi del giorno */}
              <div className="divide-y divide-border-subtle">
                {corseGiorno.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-start gap-4">
                    <div className="font-mono text-sm text-on-surface-variant shrink-0 w-20">
                      {c.ora_partenza.slice(0, 5)}
                      {c.ora_fine && <><br /><span className="text-xs">→ {c.ora_fine.slice(0, 5)}</span></>}
                    </div>
                    <div className="flex-1 min-w-0">
                      {c.cliente_nome && (
                        <p className="text-sm font-medium text-foreground">{c.cliente_nome}
                          {c.n_pax && c.n_pax > 1 && <span className="ml-2 text-xs text-on-surface-variant">{c.n_pax} pax</span>}
                        </p>
                      )}
                      <p className="text-xs text-on-surface-variant truncate">{c.origine} → {c.destinazione}</p>
                      {c.tipo_servizio && <p className="text-xs text-on-surface-variant/60">{c.tipo_servizio}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-lg font-medium", pagamentoBadgeStyle[c.tipo_pagamento])}>
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
