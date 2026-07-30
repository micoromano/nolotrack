import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus, Clock } from "@phosphor-icons/react/dist/ssr";

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return `${h}h ${m}m`;
}

export default async function TurniPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: turni } = await supabase
    .from("turni")
    .select("*")
    .eq("autista_id", user!.id)
    .order("data", { ascending: false })
    .limit(30);

  const totOre = turni?.reduce((acc, t) => acc + Number(t.ore_lavorate), 0) ?? 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Turni</h1>
          <p className="text-xs text-on-surface-variant">Ultimi 30 turni registrati</p>
        </div>
        <Link href="/dashboard/turni/nuovo" className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20")}>
          <Plus size={14} weight="bold" />
          Nuovo turno
        </Link>
      </header>

      <div className="px-4 md:px-10 py-8 max-w-[1440px] mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="p-2.5 bg-sky-400/10 rounded-xl w-fit mb-3">
              <Clock size={18} weight="fill" className="text-sky-400" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Turni totali</p>
            <p className="font-mono text-2xl font-bold text-foreground">{turni?.length ?? 0}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="p-2.5 bg-primary/10 rounded-xl w-fit mb-3">
              <Clock size={18} weight="fill" className="text-primary" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Ore totali</p>
            <p className="font-mono text-2xl font-bold text-foreground">{formatOre(totOre)}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden hidden sm:block">
            <div className="p-2.5 bg-tertiary/10 rounded-xl w-fit mb-3">
              <Clock size={18} weight="fill" className="text-tertiary" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-secondary-container mb-1">Media ore / turno</p>
            <p className="font-mono text-2xl font-bold text-foreground">
              {turni?.length ? formatOre(totOre / turni.length) : "0h"}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 px-6 py-3 border-b border-border-subtle bg-surface-container-low/50">
            {["Data", "Inizio", "Fine", "Ore"].map(h => (
              <span key={h} className={cn("text-[11px] font-bold uppercase tracking-wider text-on-secondary-container", h === "Ore" && "text-right")}>{h}</span>
            ))}
          </div>

          {!turni?.length && (
            <div className="px-6 py-16 text-center">
              <Clock size={32} weight="light" className="text-on-surface-variant mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">Nessun turno registrato.</p>
            </div>
          )}

          <div className="divide-y divide-border-subtle">
            {turni?.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/turni/${t.id}`}
                className="grid grid-cols-4 px-6 py-4 hover:bg-surface-variant/20 transition-colors cursor-pointer items-center"
              >
                <span className="text-sm font-medium capitalize text-foreground">
                  {new Date(t.data).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
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
