import { headers } from "next/headers";

/**
 * Estrae la lingua preferita dall'header Accept-Language inviato dal browser
 * (es. "it-IT,it;q=0.9,en;q=0.8" -> "it-IT"). Usata per formattare date/orari
 * nei Server Component secondo il locale del dispositivo che ha fatto la richiesta,
 * invece di un locale fisso.
 */
export function parseAcceptLanguage(acceptLanguage: string | null): string | undefined {
  if (!acceptLanguage) return undefined;
  const first = acceptLanguage.split(",")[0]?.trim().split(";")[0];
  return first || undefined;
}

export async function getServerLocale(): Promise<string | undefined> {
  const h = await headers();
  return parseAcceptLanguage(h.get("accept-language"));
}
