# Buffex

Generador de recetas con IA. De tus ingredientes a una receta personalizada en 10 segundos.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Auth + DB**: Firebase Auth + Firestore
- **AI**: OpenAI GPT-4 Turbo (recetas) + DALL-E 3 (imágenes)
- **Pagos**: Stripe (subscripciones + pay-as-you-go)
- **Email**: Resend
- **Estilos**: Tailwind CSS 4 + DaisyUI 5
- **Animaciones**: Framer Motion
- **i18n**: react-i18next (ES / EN)

## Desarrollo local

```bash
npm install
npm run dev
```

Copia `.env.local.example` a `.env.local` y rellena las variables.

## Variables de entorno requeridas

```
NEXT_PUBLIC_FIREBASE_*              Firebase config
FIREBASE_SERVICE_ACCOUNT_KEY        Firebase Admin (JSON en base64)
OPENAI_API_KEY                      OpenAI
STRIPE_SECRET_KEY                   Stripe (backend)
STRIPE_WEBHOOK_SECRET               Stripe webhook
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  Stripe (frontend)
STRIPE_PRICE_PREMIUM                Price ID suscripción Premium (€9.99/mes)
STRIPE_PRICE_PAYG                   Price ID pack recetas (€4.99)
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM    (mismo, accesible en cliente)
NEXT_PUBLIC_STRIPE_PRICE_PAYG       (mismo, accesible en cliente)
RESEND_API_KEY                      Resend email
NEXT_PUBLIC_POLICY_VERSION          Versión del consentimiento (ej: 1.0.5)
```

## Planes de precios

| Plan | Precio | Recetas |
|------|--------|---------|
| Gratuito | €0 | 5/mes |
| Pay-as-you-go | €4.99 único | +15 recetas |
| Premium | €9.99/mes | Ilimitadas |

## Deploy

Vercel. Configura las variables de entorno en el dashboard de Vercel.
