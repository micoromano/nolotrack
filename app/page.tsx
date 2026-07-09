import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig, telHref, waHref } from "@/lib/site-config";
import {
  Car, MapPin, Phone, EnvelopeSimple, WhatsappLogo, Airplane, Briefcase, Clock,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: `${siteConfig.nome} — NCC a Roma con Marco Camelin`,
  description: `Servizio di Noleggio Con Conducente (NCC) a ${siteConfig.citta}. Transfer aeroportuali, eventi e spostamenti business su prenotazione diretta.`,
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.nome} — NCC a Roma`,
    description: `Servizio di Noleggio Con Conducente a ${siteConfig.citta}.`,
    url: siteConfig.url,
    siteName: siteConfig.nome,
    locale: "it_IT",
    type: "website",
  },
};

const servizi = [
  { icon: Airplane, titolo: "Transfer aeroportuali", desc: "Fiumicino (FCO) e Ciampino (CIA), puntualità garantita." },
  { icon: Briefcase, titolo: "Spostamenti business", desc: "Trasferimenti per lavoro, meeting ed eventi." },
  { icon: Clock, titolo: "Servizio su prenotazione", desc: "Corse organizzate in anticipo, nessuna corsa a chiamata estemporanea." },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.nome,
    description: "Servizio di Noleggio Con Conducente (NCC)",
    areaServed: siteConfig.citta,
    url: siteConfig.url,
    ...(siteConfig.telefono ? { telephone: siteConfig.telefono } : {}),
    ...(siteConfig.email ? { email: siteConfig.email } : {}),
    address: { "@type": "PostalAddress", addressLocality: siteConfig.citta, addressCountry: "IT" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="font-heading italic text-primary text-2xl">{siteConfig.nome}</span>
          <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "text-xs")}>
            Area riservata
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-5">
            <Car size={28} weight="fill" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Noleggio Con Conducente a {siteConfig.citta}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {siteConfig.nome} è il servizio NCC di {siteConfig.titolare}: transfer aeroportuali,
            spostamenti business ed eventi, sempre su prenotazione diretta.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {servizi.map(({ icon: Icon, titolo, desc }) => (
              <div key={titolo} className="bg-card border border-border rounded-lg p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 text-primary mb-3">
                  <Icon size={18} weight="fill" />
                </div>
                <h2 className="text-sm font-medium">{titolo}</h2>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Come prenotare</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Le corse si organizzano solo su richiesta diretta: nessuna registrazione o
              prenotazione automatica online. Contattaci telefonicamente, via email o su
              WhatsApp e concorderemo insieme data, orario e tratta.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {siteConfig.telefono && (
                <a href={telHref(siteConfig.telefono)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  <Phone size={16} weight="fill" className="mr-1.5" />
                  {siteConfig.telefono}
                </a>
              )}
              {siteConfig.whatsapp && (
                <a
                  href={waHref(siteConfig.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <WhatsappLogo size={16} weight="fill" className="mr-1.5" />
                  WhatsApp
                </a>
              )}
              <a href={`mailto:${siteConfig.email}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                <EnvelopeSimple size={16} weight="fill" className="mr-1.5" />
                {siteConfig.email}
              </a>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={14} />
              <span>Zona di servizio: {siteConfig.citta}</span>
            </div>
            {siteConfig.licenzaNcc && (
              <p className="mt-1 text-xs text-muted-foreground">
                Licenza NCC n. {siteConfig.licenzaNcc}
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {siteConfig.nome} — {siteConfig.titolare}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/termini" className="hover:text-foreground">Termini</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
