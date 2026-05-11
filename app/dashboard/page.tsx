import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatOre(ore: number) {
  const h = Math.floor(ore);
  const m = Math.round((ore - h) * 60);
  return `${h}h ${m}m`;
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const oggi = new Date().toISOString().split("T")[0];

  const [{ data: turnoOggi }, { data: corseOggi }] = await Promise.all([
    supabase
      .from("turni")
      .select("*")
      .eq("autista_id", user!.id)
      .eq("data", oggi)
      .maybeSingle(),
    supabase
      .from("corse")
      .select("*")
      .eq("autista_id", user!.id)
      .eq("data", oggi),
  ]);

  const totCash = corseOggi?.filter((c) => c.tipo_pagamento === "cash").reduce((s, c) => s + c.importo, 0) ?? 0;
  const totCarta = corseOggi?.filter((c) => c.tipo_pagamento === "carta").reduce((s, c) => s + c.importo, 0) ?? 0;
  const totUber = corseOggi?.filter((c) => c.tipo_pagamento === "uber").reduce((s, c) => s + c.importo, 0) ?? 0;
  const totale = totCash + totCarta + totUber;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oggi</h1>
        <span className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ore lavorate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{turnoOggi ? formatOre(turnoOggi.ore_lavorate) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEuro(totCash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Carta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEuro(totCarta)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Uber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatEuro(totUber)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Totale incassato oggi</p>
            <p className="text-3xl font-bold">{formatEuro(totale)}</p>
            <p className="text-sm text-muted-foreground mt-1">{corseOggi?.length ?? 0} corse</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard/corse/nuova" className={cn(buttonVariants())}>
              + Corsa
            </Link>
            <Link href="/dashboard/turni/nuovo" className={cn(buttonVariants({ variant: "outline" }))}>
              {turnoOggi ? "Modifica turno" : "+ Turno"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
