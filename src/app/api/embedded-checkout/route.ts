/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db, auth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[embedded-checkout] 401 - Header Authorization ausente o malformado:", authHeader ?? "(vacío)");
      return NextResponse.json({ error: "Token de autenticación requerido" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    let decodedUid: string;
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      decodedUid = decodedToken.uid;
    } catch (tokenError: any) {
      console.error("[embedded-checkout] Token inválido:", tokenError?.message ?? tokenError);
      return NextResponse.json({ error: "Token de autenticación inválido" }, { status: 401 });
    }

    const body = await request.json();

    // Verificar que el usuario solo puede crear sesiones para sí mismo
    if (body.userId && decodedUid !== body.userId) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
    }
    const userId = decodedUid;

    // =============================================
    // OBTENER O CREAR CUSTOMER EN STRIPE
    // =============================================
    let customerId;

    const userDoc = await db.collection("user").doc(userId).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      customerId = userData?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData?.email,
          metadata: { userId },
        });
        customerId = customer.id;
        await userDoc.ref.update({ stripeCustomerId: customerId });
      }
    } else {
      return NextResponse.json({ message: "Usuario no encontrado en Firebase" }, { status: 404 });
    }

    // Detectar país del usuario via Vercel geolocation
    const country = request.headers.get("x-vercel-ip-country") || "ES";
    const isUS = country === "US";

    // Mapping EUR → USD price IDs
    const EUR_TO_USD: Record<string, string | undefined> = {
      [process.env.STRIPE_PRICE_PREMIUM ?? ""]:        process.env.STRIPE_PRICE_PREMIUM_USD,
      [process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? ""]: process.env.STRIPE_PRICE_PREMIUM_ANNUAL_USD,
      [process.env.STRIPE_PRICE_PAYG ?? ""]:           process.env.STRIPE_PRICE_PAYG_USD,
    };
    const effectivePriceId = (isUS && EUR_TO_USD[body.priceId]) ? EUR_TO_USD[body.priceId]! : body.priceId;

    // Determinar si es suscripción o compra única
    const subscriptionPriceIds = [
      "price_1RwHJCRpBiBhmezm4D1fPQt5",       // legacy Premium €7.99
      process.env.STRIPE_PRICE_PREMIUM,         // Premium €9.99/mes
      process.env.STRIPE_PRICE_PREMIUM_ANNUAL,  // Premium €79.99/año
      process.env.STRIPE_PRICE_PREMIUM_USD,     // Premium $10.99/mes
      process.env.STRIPE_PRICE_PREMIUM_ANNUAL_USD, // Premium $87.99/año
    ].filter(Boolean);
    const isSubscription = subscriptionPriceIds.includes(effectivePriceId);

    const session = await stripe.checkout.sessions.create({
      ui_mode: "hosted",
      payment_method_types: isSubscription
        ? ["card", "amazon_pay", "revolut_pay"]
        : ["card", "amazon_pay", "revolut_pay", "paypal"],
      customer: customerId,
      line_items: [{ quantity: 1, price: effectivePriceId }],
      ...(isSubscription ? {} : { invoice_creation: { enabled: true } }),
      mode: isSubscription ? "subscription" : "payment",
      automatic_tax: { enabled: true },
      customer_update: { address: "auto" },
      success_url: `${request.headers.get("origin")}/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/kitchen`,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[embedded-checkout] Error inesperado:", error?.message ?? error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
