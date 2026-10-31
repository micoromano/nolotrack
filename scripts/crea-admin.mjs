#!/usr/bin/env node
// =============================================================================
// Crea (o promuove) un utente amministratore di NoloTrack
// =============================================================================
// Eseguire DENTRO il container dell'app, che conosce già URL e service key:
//
//   docker compose exec app node scripts/crea-admin.mjs \
//     --email mario@example.com --password 'UnaPasswordLunga!' --nome "Mario Rossi"
//
// Se l'utente esiste già, viene solo promosso ad admin (la password non cambia).
// Opzioni: --ruolo autista|dispatcher|admin (default admin)
// Usa le API GoTrue (admin) e PostgREST con la SUPABASE_SERVICE_ROLE_KEY.
// =============================================================================

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, arr) => {
    if (v.startsWith("--")) acc.push([v.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const base = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { email, password, nome } = args;
const ruolo = args.ruolo || "admin";

function esci(msg) {
  console.error(`ERRORE: ${msg}`);
  process.exit(1);
}

if (!base || !key) esci("SUPABASE_INTERNAL_URL/SUPABASE_SERVICE_ROLE_KEY non impostate (esegui dentro il container app).");
if (!email) esci("--email obbligatoria");
if (!["admin", "dispatcher", "autista"].includes(ruolo)) esci("--ruolo deve essere admin, dispatcher o autista");

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function api(path, init = {}) {
  const res = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, body };
}

// 1. Crea l'utente (email già confermata), oppure recupera quello esistente
let userId;
if (password) {
  if (password.length < 8) esci("la password deve avere almeno 8 caratteri");
  const r = await api("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { nome: nome || email.split("@")[0] } }),
  });
  if (r.ok) {
    userId = r.body.id;
    console.log(`Utente creato: ${email}`);
  } else if (r.status !== 422) {
    esci(`creazione utente fallita (${r.status}): ${JSON.stringify(r.body)}`);
  }
}

if (!userId) {
  const r = await api(`/rest/v1/autisti?select=id&email=eq.${encodeURIComponent(email)}`);
  if (!r.ok || !r.body?.length) {
    esci(password
      ? `l'utente ${email} esiste in auth ma non ha un profilo autista.`
      : `utente ${email} non trovato: aggiungi --password per crearlo.`);
  }
  userId = r.body[0].id;
  console.log(`Utente esistente: ${email}`);
}

// 2. Assegna il ruolo
const r = await api(`/rest/v1/ruoli?select=id&nome=eq.${ruolo}`);
if (!r.ok || !r.body?.length) esci(`ruolo '${ruolo}' non trovato: lo schema è stato applicato? (docker compose logs migrate)`);

const upd = await api(`/rest/v1/autisti?id=eq.${userId}`, {
  method: "PATCH",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({ ruolo_id: r.body[0].id, ruolo, ...(nome ? { nome } : {}) }),
});
if (!upd.ok || !upd.body?.length) esci(`assegnazione ruolo fallita (${upd.status}): ${JSON.stringify(upd.body)}`);

console.log(`Ruolo '${ruolo}' assegnato a ${email}. Ora puoi accedere da ${process.env.NEXT_PUBLIC_APP_URL ?? "l'app"}/login`);
