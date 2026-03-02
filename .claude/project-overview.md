# Buffex — Project Overview

> Actualizado: 2026-02-26

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15.3.4 (App Router) |
| Estilos | Tailwind CSS 4 + DaisyUI 5 |
| Tipografía | Fraunces (serif, display) + Plus Jakarta Sans (body) via next/font/google |
| Auth | Firebase Authentication (email/password + Google) |
| DB | Firestore (Firebase Admin SDK en servidor) |
| IA recetas | OpenAI GPT-4 Turbo (json_object mode, max_tokens: 2000, timeout: 30s) |
| IA imágenes | DALL-E 3 (fallback: gpt-image-1) |
| Pagos | Stripe (Checkout hosted, Webhooks, SetupIntents) |
| Email | Resend (estable) |
| Analytics | Vercel Analytics (gated por consentimiento) |
| Deploy | Vercel |
| i18n | react-i18next, locales en `/public/locales/{es,en}/translation.json` |
| Iconos | lucide-react + @mdi/react (NO emojis como iconos) |

## Modelo de Negocio

| Plan | Precio | Recetas/mes | Extras |
|------|--------|-------------|--------|
| Gratuito | €0 | 5 | Ingredientes, tiempo, dificultad, meal time, comensales |
| Pay-as-you-go | €4.99 único | +15 | Mismas features del plan activo |
| Premium | €9.99/mes | Ilimitadas | + restricciones, cocina, macros avanzados |
| Premium Anual | €79.99/año | Ilimitadas | Todo Premium |

**Internamente:** 10 tokens = 1 receta. Free: 50 monthly_tokens. Premium: 9999 monthly_tokens. PAYG: 150 extra_tokens.

## Estructura del Formulario (KitchenContent)

Refactorizado en Feb 2026 de un mega-componente de 1609 líneas a:

```
src/
├── app/kitchen/KitchenContent.tsx          ← Orquestador (~150 líneas)
├── components/kitchenForm/
│   ├── IngredientSection.tsx               ← Input + tags + sugerencias
│   ├── MealTimeSelector.tsx                ← 4 botones horizontales
│   ├── QuickOptions.tsx                    ← Tiempo + dificultad + comensales
│   ├── AdvancedOptionsPanel.tsx            ← Tabs: Restricciones/Cocina/Macros/Utensilios
│   ├── ControlMacronutrientes.tsx          ← Control macros (sin cambios)
│   ├── GenerateButton.tsx                  ← Botón submit con estados
│   ├── LoadingOverlay.tsx                  ← Overlay con tips rotativos
│   └── FormTag.tsx                         ← Chip reutilizable
├── hooks/
│   ├── useRecipeForm.ts                    ← TODO el estado + lógica del formulario
│   └── useIngredientHistory.tsx            ← Sin cambios
├── utils/
│   └── image-compression.ts               ← Funciones de canvas/compresión
└── types/
    └── kitchen.ts                          ← Interfaces TypeScript
```

## Archivos Clave API

| Ruta | Descripción |
|------|-------------|
| `src/app/api/openai/route.ts` | Generación de recetas (GPT-4 Turbo, timeout 30s) |
| `src/app/api/recipe-image/route.ts` | Imagen con DALL-E 3 |
| `src/app/api/stripe-webhook/route.ts` | Manejo eventos Stripe (con idempotencia) |
| `src/app/api/deduct-tokens/route.ts` | Descuento de tokens (transacción Firestore) |
| `src/context/user-context.tsx` | Estado global de usuario |

## Stripe Price IDs

| Variable env | Descripción | Precio |
|---|---|---|
| `STRIPE_PRICE_PREMIUM` | Premium mensual | €9.99/mes |
| `STRIPE_PRICE_PREMIUM_ANNUAL` | Premium anual | €79.99/año |
| `STRIPE_PRICE_PAYG` | Pack 15 recetas | €4.99 único |
| `price_1RwHJCRpBiBhmezm4D1fPQt5` | Legacy Premium (mantener en webhook) | €7.99/mes |

## Convenciones

- **i18n**: todos los textos por i18n. Añadir en ambos `locales/es` y `locales/en`.
- **Imágenes de recetas**: base64 data URL en Firestore → `<Image unoptimized />`.
- **NO commitear**: `.env`, `google-services.json`, `GoogleService-Info.plist`.
- **APIs**: no modificar sin confirmar — son producción.
- **Tailwind v4**: usar `next/font/google` para fuentes, no `@import url()` en CSS.

## Deuda Técnica Pendiente

- [ ] Test E2E con Playwright (flujo registro → generar receta → upgrade)
- [ ] Contador de recetas generadas en Firestore (para mostrar social proof en landing)
- [ ] Modal post-primera-receta (`FirstRecipeModal.tsx`)
