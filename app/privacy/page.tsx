import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Privacy Policy — ${siteConfig.nome}`,
  description: "Informativa sul trattamento dei dati personali.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-primary hover:underline">&larr; Torna al sito</Link>
        <h1 className="text-2xl font-semibold mt-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-base font-medium mb-2">1. Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento dei dati è {siteConfig.titolare}, in qualità di
              esercente il servizio di Noleggio Con Conducente (NCC) "{siteConfig.nome}".
              Contatto: <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">2. Dati raccolti</h2>
            <p>
              Questo sito è una pagina informativa: non presenta moduli di iscrizione o
              raccolta dati automatica e non utilizza cookie di profilazione o strumenti di
              tracciamento di terze parti.
            </p>
            <p className="mt-2">
              Quando ci contatti telefonicamente, via email o su WhatsApp per organizzare un
              servizio, trattiamo i dati che ci fornisci volontariamente (nome, recapito
              telefonico, indirizzo email, dettagli della corsa richiesta) al solo fine di
              erogare il servizio richiesto.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">3. Comunicazioni via WhatsApp</h2>
            <p>
              Le comunicazioni scambiate tramite WhatsApp Business API sono trattate tramite
              l&apos;infrastruttura Meta/WhatsApp, che agisce come responsabile del trattamento
              per l&apos;invio e la ricezione dei messaggi. I messaggi e lo stato del servizio
              vengono conservati per il tempo necessario a gestire la corsa e la relativa
              rendicontazione amministrativa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">4. Finalità e base giuridica</h2>
            <p>
              I dati sono trattati per l&apos;esecuzione di un servizio richiesto
              dall&apos;interessato (art. 6.1.b GDPR) e per l&apos;adempimento di obblighi
              fiscali e amministrativi (art. 6.1.c GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">5. Conservazione</h2>
            <p>
              I dati sono conservati per il tempo necessario a erogare il servizio e per gli
              adempimenti di legge previsti in materia fiscale e amministrativa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium mb-2">6. Diritti dell&apos;interessato</h2>
            <p>
              È possibile richiedere in qualsiasi momento accesso, rettifica, cancellazione o
              limitazione del trattamento dei propri dati scrivendo a{" "}
              <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
