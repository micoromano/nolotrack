import type { CapacitorConfig } from "@capacitor/cli";

// NoloTrack ha pagine server-rendered, API routes e Supabase server components:
// NON è un sito statico, quindi non usiamo `next export`. Il guscio nativo
// carica direttamente il deploy web reale (Vercel) tramite `server.url`,
// riusando il 100% del codice esistente. Vedi docs/app-mobile.md.
//
// NEXT_PUBLIC_APP_URL è già documentata in CLAUDE.md come origine pubblica
// dell'app (usata per link email/invito, callback WhatsApp, canonical/OG).
// Qui viene riletta per puntare il guscio nativo allo stesso deploy.
const serverUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  // Placeholder: sostituire con l'URL reale del deploy Vercel prima di
  // buildare l'app (o impostare NEXT_PUBLIC_APP_URL nell'ambiente di build).
  "https://nolotrack.example.com";

const config: CapacitorConfig = {
  appId: "com.nolotrack.app",
  appName: "NoloTrack",
  webDir: "public",
  server: {
    url: serverUrl,
    androidScheme: "https",
  },
};

export default config;
