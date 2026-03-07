import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "UserId requerido" }, { status: 400 });
    }

    const userDoc = await db.collection("user").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.stripeCustomerId) {
      return NextResponse.json({ error: "No hay customer ID asociado" }, { status: 400 });
    }

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "No hay suscripciones activas" }, { status: 400 });
    }

    const activeSub = subscriptions.data[0];
    const currentInterval = activeSub.items.data[0]?.price?.recurring?.interval;

    if (currentInterval !== "year") {
      return NextResponse.json({ error: "La suscripción ya es mensual" }, { status: 400 });
    }

    const monthlyPriceId = process.env.STRIPE_PRICE_PREMIUM;
    if (!monthlyPriceId) {
      return NextResponse.json({ error: "Precio mensual no configurado" }, { status: 500 });
    }

    // Switch to monthly at end of current period (no immediate charge / no proration)
    const updatedSub = await stripe.subscriptions.update(activeSub.id, {
      items: [{ id: activeSub.items.data[0].id, price: monthlyPriceId }],
      proration_behavior: "none",
      billing_cycle_anchor: "unchanged",
    });

    return NextResponse.json({
      success: true,
      message: "Suscripción cambiada a mensual al final del período actual",
      subscription: updatedSub,
    });
  } catch (error) {
    console.error("Error downgrading subscription:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
