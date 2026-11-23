// Solo lato server: usa le credenziali R2 (mai importare da un client component).
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 tramite API S3-compatibile.
// Con R2_ENDPOINT si può puntare a qualsiasi storage S3 (es. MinIO in self-hosting).

/** Durata degli URL firmati, in secondi. */
const SCADENZA_UPLOAD = 5 * 60;
const SCADENZA_DOWNLOAD = 5 * 60;

export interface ConfigR2 {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function configR2(): ConfigR2 | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

let clientCache: { chiave: string; client: S3Client } | null = null;

function client(cfg: ConfigR2): S3Client {
  const chiave = `${cfg.endpoint}|${cfg.accessKeyId}`;
  if (clientCache?.chiave === chiave) return clientCache.client;
  const c = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    // MinIO e altri storage self-hosted richiedono gli URL "path-style"
    forcePathStyle: Boolean(process.env.R2_ENDPOINT),
    // R2 non supporta i checksum CRC32 che l'SDK aggiunge di default agli URL firmati
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  clientCache = { chiave, client: c };
  return c;
}

/** URL firmato con cui il browser carica il file direttamente nel bucket (PUT). */
export async function urlUpload(
  cfg: ConfigR2,
  chiave: string,
  contentType: string,
  dimensione: number,
): Promise<string> {
  return getSignedUrl(
    client(cfg),
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: chiave,
      ContentType: contentType,
      ContentLength: dimensione,
    }),
    { expiresIn: SCADENZA_UPLOAD, signableHeaders: new Set(["content-type", "content-length"]) },
  );
}

/** URL firmato per scaricare o visualizzare il file. */
export async function urlDownload(
  cfg: ConfigR2,
  chiave: string,
  nomeFile: string,
  inline: boolean,
): Promise<string> {
  const disposizione = `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(nomeFile)}`;
  return getSignedUrl(
    client(cfg),
    new GetObjectCommand({ Bucket: cfg.bucket, Key: chiave, ResponseContentDisposition: disposizione }),
    { expiresIn: SCADENZA_DOWNLOAD },
  );
}

/** Dimensione e tipo dell'oggetto, o null se non esiste. */
export async function infoOggetto(
  cfg: ConfigR2,
  chiave: string,
): Promise<{ dimensione: number; contentType: string | undefined } | null> {
  try {
    const res = await client(cfg).send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: chiave }));
    return { dimensione: res.ContentLength ?? 0, contentType: res.ContentType };
  } catch (e) {
    const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw e;
  }
}

/** Elimina più oggetti (max 1000 per chiamata). Restituisce le chiavi eliminate. */
export async function eliminaOggetti(cfg: ConfigR2, chiavi: string[]): Promise<string[]> {
  if (chiavi.length === 0) return [];
  const res = await client(cfg).send(
    new DeleteObjectsCommand({
      Bucket: cfg.bucket,
      Delete: { Objects: chiavi.map((Key) => ({ Key })), Quiet: true },
    }),
  );
  const fallite = new Set((res.Errors ?? []).map((e) => e.Key));
  return chiavi.filter((k) => !fallite.has(k));
}
