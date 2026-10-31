/**
 * Origine pubblica (es. "https://nolotrack.example.com") della richiesta.
 *
 * Dietro un reverse proxy (gateway nginx in Docker, Vercel) `new URL(req.url).origin`
 * può restituire l'indirizzo interno del server Next.js (es. https://0.0.0.0:3000
 * in modalità standalone): per redirect e redirect_uri OAuth va usato l'host
 * pubblico che il proxy inoltra negli header X-Forwarded-Host / Host.
 */
export function originRichiesta(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host")?.split(",")[0].trim() || req.headers.get("host");
  if (!host) return url.origin;
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
