import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  return (
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Turni</h1>
          <p className="text-xs text-muted-foreground">Ultimi 30 turni registrati</p>
        </div>
        <Link href="/dashboard/turni/nuovo" className={cn(buttonVariants({ size: "sm" }), "text-xs")}>
          + Nuovo turno
        </Link>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-card border border-border rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inizio</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fine</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Ore</span>
          </div>

          {!turni?.length && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">
              Nessun turno registrato.
            </p>
          )}

          <div className="divide-y divide-border">
            {turni?.map((t) => (
              <Link key={t.id} href={`/dashboard/turni/${t.id}`}
                className="grid grid-cols-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer">
                <span className="text-sm capitalize">
                  {new Date(t.data).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                </span>
                <span className="font-mono text-sm">{t.ora_inizio.slice(0, 5)}</span>
                <span className="font-mono text-sm">{t.ora_fine.slice(0, 5)}</span>
                <span className="font-mono text-sm font-medium text-primary text-right">
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
