"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NuovoTurnoPage() {
  const oggi = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(oggi);
  const [oraInizio, setOraInizio] = useState("");
  const [oraFine, setOraFine] = useState("");
  const [note, setNote] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");

    if (oraFine <= oraInizio) {
      setErrore("L'ora di fine deve essere dopo l'ora di inizio.");
      return;
    }

    setCaricamento(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("turni").upsert({
      autista_id: user!.id,
      data,
      ora_inizio: oraInizio,
      ora_fine: oraFine,
      note: note || null,
    }, { onConflict: "autista_id,data" });

    if (error) {
      setErrore("Errore nel salvataggio: " + error.message);
      setCaricamento(false);
      return;
    }

    router.push("/dashboard/turni");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nuovo turno</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salva} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inizio">Ora inizio</Label>
              <Input id="inizio" type="time" value={oraInizio} onChange={(e) => setOraInizio(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fine">Ora fine</Label>
              <Input id="fine" type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note">Note (opzionale)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {errore && <p className="text-sm text-red-500">{errore}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={caricamento} className="flex-1">
                {caricamento ? "Salvataggio..." : "Salva"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annulla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
