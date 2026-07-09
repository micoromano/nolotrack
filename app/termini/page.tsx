import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Termini di servizio — ${siteConfig.nome}`,
  description: "Condizioni generali del servizio di Noleggio Con Conducente.",
  alternates: { canonical: "/termini" },
};

export default function TerminiPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-primary hover:underline">&larr; Torna al sito</Link>
        <h1 className="text-2xl font-semibold mt-6">Termini di servizio</h1>
        <p className="text-sm text-muted-foreground mt-1">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-base font-medium mb-2">1. Natura del sito</h2>
            <p>
              Questo sito ha finalità puramente informativa e presenta il servizio di
              Noleggio Con Conducente (NCC) erogato da {siteConfig.titolare}. Il sito non
              consente prenotazioni o iscrizioni online: ogni corsa viene concordata
              individualmente tramite contatto diretto (telefono, email o WhatsApp).
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">2. Prenotazione del servizio</h2>
            <p>
              Data, orario, tratta e corrispettivo di ogni corsa vengono concordati
              direttamente con il cliente prima dell&apos;esecuzione del servizio. La
              conferma tramite i canali di contatto indicati costituisce accordo tra le
              parti.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">3. Comunicazioni WhatsApp</h2>
            <p>
              Il servizio può utilizzare WhatsApp per aggiornamenti sullo stato della corsa
              (es. inizio/fine servizio). L&apos;utente che avvia una conversazione su
              WhatsApp con {siteConfig.nome} acconsente a ricevere questo tipo di messaggi
              operativi relativi alla corsa richiesta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">4. Responsabilità</h2>
            <p>
              Il servizio è svolto nel rispetto della normativa vigente in materia di
              trasporto di persone mediante Noleggio Con Conducente.
              {siteConfig.licenzaNcc ? ` Licenza NCC n. ${siteConfig.licenzaNcc}.` : ""}
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">5. Contatti</h2>
            <p>
              Per qualsiasi informazione: <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
