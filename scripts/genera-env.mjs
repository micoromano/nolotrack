#!/usr/bin/env node
// =============================================================================
// Genera i segreti per l'installazione self-hosted e li scrive in .env
// =============================================================================
//   node scripts/genera-env.mjs            → compila solo i campi vuoti
//   node scripts/genera-env.mjs --forza    → rigenera TUTTI i segreti
//
// Segreti generati:
//   POSTGRES_PASSWORD  password del database (solo caratteri sicuri per URL)
//   JWT_SECRET         chiave HMAC che firma i token di sessione
//   ANON_KEY           JWT {role: "anon"}          — pubblico, finisce nel browser
//   SERVICE_ROLE_KEY   JWT {role: "service_role"}  — SEGRETO, bypassa la RLS
//
// ⚠ Se il database è già stato creato, cambiare POSTGRES_PASSWORD qui NON
//   cambia la password nel DB: vedi docs/self-hosting/TROUBLESHOOTING.md.
// Nessuna dipendenza: solo moduli Node integrati (Node >= 18).
// =============================================================================
import { randomBytes, createHmac } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");
const forza = process.argv.includes("--forza");

if (!existsSync(envPath)) {
  copyFileSync(examplePath, envPath);
  console.log("Creato .env da .env.example");
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

function firmaJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

let testo = readFileSync(envPath, "utf8");
const leggi = (k) => testo.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim() ?? "";
const scrivi = (k, v) => {
  testo = new RegExp(`^${k}=`, "m").test(testo)
    ? testo.replace(new RegExp(`^${k}=.*$`, "m"), `${k}=${v}`)
    : `${testo.trimEnd()}\n${k}=${v}\n`;
};
const daGenerare = (k) => forza || !leggi(k);

const generati = [];

if (daGenerare("POSTGRES_PASSWORD")) {
  scrivi("POSTGRES_PASSWORD", randomBytes(24).toString("hex"));
  generati.push("POSTGRES_PASSWORD");
}

let jwtCambiato = false;
if (daGenerare("JWT_SECRET")) {
  scrivi("JWT_SECRET", randomBytes(48).toString("base64url"));
  generati.push("JWT_SECRET");
  jwtCambiato = true;
}

const secret = leggi("JWT_SECRET");
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 10 * 365 * 24 * 3600; // 10 anni: sono chiavi API, non sessioni

for (const [k, role] of [["ANON_KEY", "anon"], ["SERVICE_ROLE_KEY", "service_role"]]) {
  if (jwtCambiato || daGenerare(k)) {
    scrivi(k, firmaJwt({ role, iss: "supabase", iat, exp }, secret));
    generati.push(k);
  }
}

if (!leggi("META_WHATSAPP_VERIFY_TOKEN")) {
  scrivi("META_WHATSAPP_VERIFY_TOKEN", randomBytes(16).toString("hex"));
  generati.push("META_WHATSAPP_VERIFY_TOKEN");
}

writeFileSync(envPath, testo);

if (generati.length) {
  console.log(`Aggiornato .env → ${generati.join(", ")}`);
  if (jwtCambiato) {
    console.log("JWT_SECRET nuovo: ricostruisci l'app (docker compose up -d --build) — l'ANON_KEY è nel bundle.");
  }
} else {
  console.log("Nessun segreto da generare (usa --forza per rigenerarli tutti).");
}
