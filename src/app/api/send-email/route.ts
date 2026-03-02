/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/send-email/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Resend } from "resend";
// Asegúrate de que estas funciones devuelvan string y NO usen hooks ni "use client"
import { WelcomeEmailHtmlEN } from "@/app/emails/WelcomeEN"; //Welcome Email Ingles
import { WelcomeEmailHtmlES } from "@/app/emails/WelcomeES"; //Welcome Email Español
import { UnsubscribeEmailHtmlES } from "@/app/emails/UnsuscribedEmailES"; //Unsuscribed Email Español
import { UnsubscribeEmailHtmlEN } from "@/app/emails/UnsuscribedEmailEN"; //Unsuscribed Email Ingles

export const runtime = 'nodejs';       // ⚠️ fuerza Node
export const dynamic = 'force-dynamic'; // evita cualquier intento de static
export const revalidate = 0;

const resend = new Resend(process.env.RESEND_API_KEY);

type Body =
  | { type: "welcome"; to: string | string[]; data: { firstName: string }; lang?: "en" | "es" }
  | { type: "unsubscribe"; to: string | string[]; data: { name: string; endDate: string }; lang?: "en" | "es" };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // Detecta idioma dentro del handler (no en top-level)
    const accept = (await headers()).get("accept-language") ?? "";
    const lang: "en" | "es" =
      body.lang ?? (accept.toLowerCase().startsWith("en") ? "en" : "es");

    let subject: string;
    let html: string;

    switch (body.type) {
      case "welcome": {
        const name = body.data.firstName;
        subject = lang === "en" ? "Welcome to Buffex" : "Bienvenido a Buffex";
        html = lang === "en"
          ? WelcomeEmailHtmlEN({ name })
          : WelcomeEmailHtmlES({ name });
        break;
      }
      case "unsubscribe": {
        const { name, endDate } = body.data || ({} as any);
        if (!name || !endDate) {
          return NextResponse.json(
            { error: "Faltan datos para el correo de desuscripción" },
            { status: 400 }
          );
        }
        subject = lang === "en"
          ? "Unsubscribe Confirmation"
          : "Confirmación de Cancelación de Suscripción";
        html = lang === "en"
          ? UnsubscribeEmailHtmlEN({ name, endDate })
          : UnsubscribeEmailHtmlES({ name, endDate });
        break;
      }
      default:
        return NextResponse.json({ error: "Tipo de email no válido" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Buffex <noreply@buffex.io>",
      to: body.to,
      subject,
      html,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "Error enviando email" },
      { status: 500 }
    );
  }
}
