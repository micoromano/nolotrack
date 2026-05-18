import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

// Rate limiter semplice in-memory (resettato a ogni deploy)
const rateLimit = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(userId);

  if (!entry || now > entry.reset) {
    rateLimit.set(userId, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

export interface InviaEmailBody {
  to: string;
  subject: string;
  body: string;
  attachments?: { filename: string; content: string }[]; // content is base64
}

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Non autenticato." }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return Response.json(
      { error: "Troppe richieste. Attendi un minuto." },
      { status: 429 }
    );
  }

  // Config check
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return Response.json(
      {
        error:
          "Credenziali Gmail non configurate. Imposta GMAIL_USER e GMAIL_APP_PASSWORD in .env.local.",
      },
      { status: 503 }
    );
  }

  let body: InviaEmailBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body non valido." }, { status: 400 });
  }

  const { to, subject, body: testo, attachments } = body;

  if (!to || !subject || !testo) {
    return Response.json(
      { error: "Campi obbligatori mancanti: to, subject, body." },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"NoloTrack" <${gmailUser}>`,
    to,
    subject,
    text: testo,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content, "base64"),
    })),
  };

  try {
    await transporter.sendMail(mailOptions);
    return Response.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto.";
    return Response.json({ error: `Invio fallito: ${message}` }, { status: 500 });
  }
}
