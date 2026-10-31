import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn, isoDataLocale, rangeMese } from "@/lib/utils";
import { getServerLocale } from "@/lib/locale";
import { Plus, Clock, CalendarCheck, ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { MeseSelect, PdfTurniButton } from "./client";

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return `${h}h ${m}m`;
}

export default async function TurniPage({
  searchParams,
}: {
  searchParams: Promise<{ mese?: string }>;
}) {
  const { mese: meseParam } = await searchParams;
  const locale = await getServerLocale();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const oggi = isoDataLocale();
  // Senza parametro → mese corrente; "?mese=tutti" → ultimi 30 turni (vista precedente)
  const mese = meseParam === "tutti"
    ? "tutti"
    : meseParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(meseParam)
      ? meseParam
      : oggi.slice(0, 7);

  let query = supabase
    .from("turni")
    .select("*")
    .eq("autista_id", user!.id)
    .order("data", { ascending: false });
  if (mese === "tutti") {
    query = query.limit(30);
  } else {
    const { inizio, fine } = rangeMese(mese);
    query = query.gte("data", inizio).lte("data", fine);
  }

  const [{ data: turni }, { data: tutteLeDate }] = await Promise.all([
    query,
    supabase.from("turni").select("data").eq("autista_id", user!.id),
  ]);

  const mesiDisponibili = [...new Set((tutteLeDate ?? []).map((t) => t.data.slice(0, 7)))]
    .sort()
    .reverse();

  const meseFmt = mese === "tutti"
    ? "Ultimi 30 turni registrati"
    : new Date(+mese.slice(0, 4), +mese.slice(5, 7) - 1).toLocaleDateString(locale, { month: "long", year: "numeric" });

  const turnoOggi = turni?.find((t) => t.data === oggi);

  const totOre = turni?.reduce((acc, t) => acc + Number(t.ore_lavorate), 0) ?? 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Turni</h1>
          <p className="text-xs text-on-surface-variant capitalize">{meseFmt}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
        <MeseSelect mese={mese} mesiDisponibili={mesiDisponibili} />
        <PdfTurniButton mese={mese} />
        <Link href="/dashboard/turni/nuovo" className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20")}>
          <Plus size={14} weight="bold" />
          <span className="hidden sm:inline">Nuovo turno</span>
        </Link>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-6">
        {/* Bento metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-400/5 rounded-full blur-3xl group-hover:bg-sky-400/10 transition-colors" />
            <div className="p-2.5 bg-sky-400/10 rounded-xl w-fit mb-4">
              <CalendarCheck size={20} weight="fill" className="text-sky-400" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Turni totali</p>
            <p className="font-mono text-3xl font-bold text-foreground tracking-tighter">{turni?.length ?? 0}</p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
            <div className="p-2.5 bg-primary/10 rounded-xl w-fit mb-4">
              <Clock size={20} weight="fill" className="text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Ore totali</p>
            <p className="font-mono text-3xl font-bold text-foreground tracking-tighter">{formatOre(totOre)}</p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-colors" />
            <div className="p-2.5 bg-tertiary/10 rounded-xl w-fit mb-4">
              <ChartLineUp size={20} weight="fill" className="text-tertiary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Media ore / turno</p>
            <p className="font-mono text-3xl font-bold text-foreground tracking-tighter">
              {turni?.length ? formatOre(totOre / turni.length) : "0h"}
            </p>
          </div>
        </div>

        {/* Cronologia turni */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border-subtle flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0">
                <CalendarCheck size={18} weight="fill" />
              </div>
              <span className="font-semibold text-sm text-foreground">Cronologia turni</span>
            </div>
            {turnoOggi ? (
              <span className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest text-success-emerald">
                <span className="w-2 h-2 rounded-full bg-success-emerald animate-pulse" />
                Oggi: {turnoOggi.ora_inizio.slice(0, 5)}–{turnoOggi.ora_fine.slice(0, 5)}
              </span>
            ) : (
              <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">Nessun turno oggi</span>
            )}
          </div>

          {!turni?.length && (
            <div className="px-6 py-16 text-center">
              <Clock size={32} weight="light" className="text-on-surface-variant mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant mb-4">
                {mese === "tutti" ? "Nessun turno registrato." : `Nessun turno registrato in ${meseFmt}.`}
              </p>
              <Link href="/dashboard/turni/nuovo" className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20")}>
                <Plus size={13} weight="bold" />
                Registra il primo turno
              </Link>
            </div>
          )}

          <div className="divide-y divide-border-subtle">
            {turni?.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/turni/${t.id}`}
                className="grid grid-cols-4 px-6 py-4 hover:bg-surface-variant/30 border-l-2 border-transparent hover:border-primary transition-all cursor-pointer items-center"
              >
                <span className="text-sm font-medium capitalize text-foreground">
                  {new Date(t.data).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
                </span>
                <span className="font-mono text-sm text-foreground">{t.ora_inizio.slice(0, 5)}</span>
                <span className="font-mono text-sm text-foreground">{t.ora_fine.slice(0, 5)}</span>
                <span className="font-mono text-sm font-bold text-primary text-right">
                  {formatOre(t.ore_lavorate)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
