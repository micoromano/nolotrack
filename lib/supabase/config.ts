/**
 * Configurazione condivisa dei client Supabase.
 *
 * Su Vercel + Supabase cloud basta NEXT_PUBLIC_SUPABASE_URL: browser e server
 * usano lo stesso URL pubblico e nulla cambia rispetto a prima.
 *
 * In self-hosting (Docker) il browser raggiunge Supabase tramite l'URL pubblico
 * (es. https://nolotrack.example.com), mentre il server Next.js, dentro la rete
 * Docker, deve usare un indirizzo interno (es. http://gateway): lo si indica con
 * SUPABASE_INTERNAL_URL (variabile solo server, letta a runtime).
 *
 * Il nome del cookie di sessione, di default, è derivato dall'hostname dell'URL
 * usato dal client: con due URL diversi browser e server cercherebbero cookie
 * diversi e la sessione si perderebbe. Per questo il nome è sempre calcolato
 * dall'URL PUBBLICO — identico al default di @supabase/ssr, quindi le sessioni
 * esistenti restano valide.
 */

const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** URL da usare lato server (route handler, server component, proxy). */
export function supabaseServerUrl(): string {
  return process.env.SUPABASE_INTERNAL_URL || PUBLIC_URL;
}

/** URL da usare nel browser. */
export function supabaseBrowserUrl(): string {
  return PUBLIC_URL;
}

/** Stesso nome che @supabase/ssr calcolerebbe dall'URL pubblico. */
export const supabaseCookieOptions = {
  name: `sb-${new URL(PUBLIC_URL).hostname.split(".")[0]}-auth-token`,
};
