import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Turni</h1>
        <Link href="/dashboard/turni/nuovo" className={cn(buttonVariants())}>
          + Nuovo turno
        </Link>
      </div>

      <div className="space-y-2">
        {turni?.length === 0 && (
          <p className="text-muted-foreground text-sm">Nessun turno registrato.</p>
        )}
        {turni?.map((t) => (
          <Card key={t.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {new Date(t.data).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t.ora_inizio} – {t.ora_fine}
                </p>
              </div>
              <p className="font-bold text-lg">{formatOre(t.ore_lavorate)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
