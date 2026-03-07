/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // =============================================
    // IDEMPOTENCIA: evitar procesar el mismo evento dos veces
    // =============================================
    const eventId = event.id;
    const processedRef = db.collection("processed_webhooks").doc(eventId);
    const alreadyProcessed = await processedRef.get();

    if (alreadyProcessed.exists) {
      return NextResponse.json({ received: true, skipped: true });
    }

    // Marcar como procesado inmediatamente para evitar race condition
    await processedRef.set({
      eventId,
      type: event.type,
      processedAt: new Date(),
    });

    // =============================================
    // MAPA DE PRECIOS A RECETAS
    // =============================================
    const PRICE_TO_RECIPES: Record<string, { type: string; recipes: number; name: string; isSubscription: boolean; price: number }> = {
      // Premium legacy €7.99 (mantener para suscriptores existentes)
      price_1RwHJCRpBiBhmezm4D1fPQt5: {
        type: "subscription",
        recipes: 30,
        name: "Buffex Premium Legacy",
        isSubscription: true,
        price: 7.99,
      },
      // Extra Recipes packs (legacy — archivar en Stripe pero mantener soporte)
      price_1RwHKLRpBiBhmezmK1AybT5C: { type: "recipes", recipes: 3, name: "Pack 3 recetas", isSubscription: false, price: 0.99 },
      price_1RwHL6RpBiBhmezmsEhJyMC1: { type: "recipes", recipes: 6, name: "Pack 6 Recetas", isSubscription: false, price: 1.99 },
      price_1RwHLWRpBiBhmezmY3vPGDxT: { type: "recipes", recipes: 12, name: "Pack 12 Recetas", isSubscription: false, price: 3.49 },
      price_1RwHLrRpBiBhmezmFamEW9Ct: { type: "recipes", recipes: 25, name: "Pack 25 Recetas", isSubscription: false, price: 6.49 },
      price_1RwHMCRpBiBhmezmRzyb4DAm: { type: "recipes", recipes: 60, name: "Pack 60 Recetas", isSubscription: false, price: 13.99 },
      price_1RwHMbRpBiBhmezmgyMbGrJq: { type: "recipes", recipes: 120, name: "Pack 120 Recetas", isSubscription: false, price: 24.99 },
      // Legacy subscription price IDs (EUR) — suscriptores anteriores al 2026-03-07
      price_1T3Px2RpBiBhmezmuzwSwoki: { type: "subscription", recipes: 150, name: "Buffex Premium (legacy)", isSubscription: true, price: 9.99 },
      price_1T3Px8RpBiBhmezmwz57sixq: { type: "subscription", recipes: 150, name: "Buffex Premium Anual (legacy)", isSubscription: true, price: 79.99 },
      // Legacy subscription price IDs (USD)
      price_1T6xXtRpBiBhmezmw41NJToq: { type: "subscription", recipes: 150, name: "Buffex Premium (legacy USD)", isSubscription: true, price: 10.99 },
      price_1T6xXuRpBiBhmezmbF2B1a5J: { type: "subscription", recipes: 150, name: "Buffex Premium Anual (legacy USD)", isSubscription: true, price: 87.99 },
    };

    // Añadir nuevos precios desde variables de entorno si están definidos
    if (process.env.STRIPE_PRICE_PREMIUM) {
      PRICE_TO_RECIPES[process.env.STRIPE_PRICE_PREMIUM] = {
        type: "subscription",
        recipes: 90,
        name: "Buffex Premium",
        isSubscription: true,
        price: 8.99,
      };
    }
    if (process.env.STRIPE_PRICE_PAYG) {
      PRICE_TO_RECIPES[process.env.STRIPE_PRICE_PAYG] = {
        type: "recipes",
        recipes: 30,
        name: "Pack 30 Recetas",
        isSubscription: false,
        price: 3.99,
      };
    }
    if (process.env.STRIPE_PRICE_PREMIUM_ANNUAL) {
      PRICE_TO_RECIPES[process.env.STRIPE_PRICE_PREMIUM_ANNUAL] = {
        type: "subscription",
        recipes: 90,
        name: "Buffex Premium Anual",
        isSubscription: true,
        price: 74.99,
      };
    }
    if (process.env.STRIPE_PRICE_PREMIUM_USD) {
      PRICE_TO_RECIPES[process.env.STRIPE_PRICE_PREMIUM_USD] = {
        type: "subscription", recipes: 90, name: "Buffex Premium", isSubscription: true, price: 9.99,
      };
    }
    if (process.env.STRIPE_PRICE_PREMIUM_ANNUAL_USD) {
      PRICE_TO_RECIPES[process.env.STRIPE_PRICE_PREMIUM_ANNUAL_USD] = {
        type: "subscription", recipes: 90, name: "Buffex Premium Anual", isSubscription: true, price: 82.99,
      };
    }
    if (process.env.STRIPE_PRICE_PAYG_USD) {
      PRICE_TO_RECIPES[process.env.STRIPE_PRICE_PAYG_USD] = {
        type: "recipes", recipes: 30, name: "Pack 30 Recetas", isSubscription: false, price: 4.49,
      };
    }

    // =============================================
    // NUEVA SUSCRIPCIÓN O COMPRA DE RECETAS
    // =============================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (!userId) {
        console.error("Missing userId in session metadata");
        return NextResponse.json({ error: "Missing userId in session metadata" }, { status: 400 });
      }

      // Establecer payment method como default SOLO si el customer no tiene uno
      try {
        const customerId = session.customer as string | undefined;
        if (customerId) {
          const customer = (await stripe.customers.retrieve(customerId)) as any;
          const existingDefault = customer?.invoice_settings?.default_payment_method;

          if (!existingDefault) {
            let pmId: string | undefined;

            if (session.subscription) {
              const subscription = (await stripe.subscriptions.retrieve(
                session.subscription as string,
                { expand: ["default_payment_method", "latest_invoice.payment_intent"] }
              )) as any;
              pmId =
                (subscription.default_payment_method as any)?.id ||
                (subscription.latest_invoice as any)?.payment_intent?.payment_method;
            } else {
              const fullSession = (await stripe.checkout.sessions.retrieve(
                session.id,
                { expand: ["payment_intent"] }
              )) as any;
              pmId = fullSession?.payment_intent?.payment_method;
            }

            if (pmId) {
              try {
                await stripe.paymentMethods.attach(pmId, { customer: customerId });
              } catch (attachErr: any) {
                console.warn("attach pm warning:", attachErr?.message || attachErr);
              }
              try {
                await stripe.paymentMethods.update(pmId, { allow_redisplay: "always" });
              } catch (updErr: any) {
                console.warn("Could not set allow_redisplay:", updErr?.message || updErr);
              }
              try {
                await stripe.customers.update(customerId, {
                  invoice_settings: { default_payment_method: pmId },
                });
              } catch (custUpdErr: any) {
                console.error("Error setting customer default payment method:", custUpdErr);
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Error while attempting to set default payment method:", err);
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      if (lineItems.data.length > 0) {
        const priceId = lineItems.data[0].price?.id;
        const productConfig = PRICE_TO_RECIPES[priceId as keyof typeof PRICE_TO_RECIPES];

        if (productConfig) {
          if (productConfig.isSubscription) {
            // NUEVA SUSCRIPCIÓN - Solo configurar, NO dar recetas aún (las da invoice.payment_succeeded)
            const subsRef = db.collection("user").doc(userId).collection("subscripcion");
            const existingSub = await subsRef.limit(1).get();

            const now = new Date();
            const oneMonthLater = new Date(now);
            oneMonthLater.setMonth(now.getMonth() + 1);

            const subscriptionData = {
              subscriptionId: session.subscription,
              status: "active",
              planName: productConfig.name,
              price: productConfig.price,
              recipesIncluded: productConfig.recipes,
              sessionId: session.id,
              updatedAt: new Date(),
              endsAt: oneMonthLater,
            };

            if (!existingSub.empty) {
              await existingSub.docs[0].ref.update(subscriptionData);
            } else {
              await subsRef.add({ ...subscriptionData, createdAt: new Date() });
            }

            await db.collection("user").doc(userId).update({
              isSubscribed: true,
              subscriptionStatus: "active",
              subscriptionId: session.subscription,
              stripeCustomerId: session.customer,
            });
          } else {
            if (productConfig.recipes > 0) {
              await db.collection("user").doc(userId).update({
                extra_recipes: FieldValue.increment(productConfig.recipes),
              });
            }

            await db.collection("user").doc(userId).collection("token_purchases").add({
              productName: productConfig.name,
              recipesAmount: productConfig.recipes,
              sessionId: session.id,
              priceId: priceId,
              price: productConfig.price,
              status: "Completed",
              createdAt: new Date(),
            });
          }
        }
      }
    }

    // =============================================
    // ACTUALIZACIÓN DE SUSCRIPCIÓN
    // =============================================
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const usersQuery = await db
        .collection("user")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        const subsRef = db.collection("user").doc(userId).collection("subscripcion");
        const existingSub = await subsRef.limit(1).get();

        if (subscription.cancel_at_period_end === true) {
          await userDoc.ref.update({
            subscriptionCanceled: true,
            subscriptionStatus: "cancel_at_period_end",
          });

          if (!existingSub.empty) {
            await existingSub.docs[0].ref.update({
              status: "cancel_at_period_end",
              updatedAt: new Date(),
            });
          }
        } else {
          const wasCanceled =
            userData.subscriptionCanceled === true ||
            userData.subscriptionStatus === "cancel_at_period_end";

          if (wasCanceled || userData.subscriptionStatus !== "active") {
            await userDoc.ref.update({
              subscriptionCanceled: false,
              subscriptionStatus: "active",
            });

            if (!existingSub.empty) {
              await existingSub.docs[0].ref.update({
                status: "active",
                updatedAt: new Date(),
              });
            }
          }
        }
      }
    }

    // =============================================
    // PAGO DE SUSCRIPCIÓN (PRIMER PAGO Y RENOVACIONES)
    // =============================================
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const now = new Date();
      const oneMonthLater = new Date(now);
      oneMonthLater.setMonth(now.getMonth() + 1);

      const usersQuery = await db
        .collection("user")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0];
        const userId = userDoc.id;

        if (invoice.parent?.subscription_details?.subscription) {
          // Obtener el price ID de la suscripción para determinar recetas dinámicamente
          let recipesToReset = 30; // valor por defecto (era 300 tokens / 10)
          try {
            const subscriptionId = invoice.parent.subscription_details.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price?.id;
            if (priceId && PRICE_TO_RECIPES[priceId]) {
              recipesToReset = PRICE_TO_RECIPES[priceId].recipes;
            }
          } catch (err) {
            console.warn("No se pudo obtener el price ID de la suscripción, usando 30:", err);
          }

          await userDoc.ref.update({
            monthly_recipes: recipesToReset,
            lastRenewal: new Date(),
          });

          const subsRef = db.collection("user").doc(userId).collection("subscripcion");
          const existingSub = await subsRef.limit(1).get();

          if (!existingSub.empty) {
            await existingSub.docs[0].ref.update({
              status: "active",
              lastRenewal: new Date(),
              updatedAt: new Date(),
              endsAt: oneMonthLater,
            });
          }
        }
      }
    }

    // =============================================
    // CANCELACIÓN DE SUSCRIPCIÓN
    // =============================================
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer;

      if (customerId) {
        try {
          const openInvoices = await stripe.invoices.list({
            customer: typeof customerId === "string" ? customerId : (customerId?.id ?? undefined),
            status: "open",
          });
          for (const invoice of openInvoices.data) {
            if (invoice.id) {
              await stripe.invoices.voidInvoice(invoice.id);
            }
          }
        } catch (error) {
          console.error("Error anulando invoices:", error);
        }
      }

      const usersQuery = await db
        .collection("user")
        .where("subscriptionId", "==", subscriptionId)
        .limit(1)
        .get();

      if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0];
        const userId = userDoc.id;

        await userDoc.ref.update({
          subscriptionCanceled: false,
          isSubscribed: false,
          subscriptionStatus: "cancelled",
          monthly_recipes: 5,
        });

        const subsRef = db.collection("user").doc(userId).collection("subscripcion");
        const existingSub = await subsRef.limit(1).get();

        if (!existingSub.empty) {
          await existingSub.docs[0].ref.update({
            status: "cancelled",
            updatedAt: new Date(),
          });
        }
      }
    }

    // =============================================
    // PAGO FALLIDO
    // =============================================
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const usersQuery = await db
        .collection("user")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0];
        await userDoc.ref.update({
          subscriptionStatus: "payment_failed",
          lastPaymentFailed: new Date(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error procesando webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
