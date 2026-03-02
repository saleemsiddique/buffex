# Buffex — Master Action Plan

> Actualizado: 2026-02-27

## Completado ✅

### Seguridad
- Auth en todos los endpoints (`/api/recipe-image`, `/api/billing`, `/api/payment-methods/*`, etc.)
- Race condition en `/api/deduct-tokens` → Firestore transaction
- Idempotencia en `/api/stripe-webhook` (colección `processed_webhooks`)
- Validación server-side de tokens antes de llamar OpenAI
- Timeout 30s en `/api/openai`

### SEO
- `lang="es"` en layout, H1 en hero, metadata en todas las páginas
- JSON-LD (Organization, WebApplication, FAQPage, PriceRange)
- Sitemap completo, hreflang alternates

### Monetización
- Stripe: Premium €9.99/mes, Anual €79.99/año, PAYG €4.99 (15 recetas)
- Webhook actualizado con `PRICE_TO_RECIPES` y valores en recetas (no tokens)
- Precios legacy €7.99 mantenidos para suscriptores existentes

### UI/UX
- Tokens → Recetas en toda la UI y i18n (ES + EN)
- Onboarding rediseñado (4 pasos, brand colors, sin tokens)
- Landing: hero, pricing (3 planes), CTA final, FAQ mejorada
- Formulario kitchen completamente rediseñado:
  - Extraído a hook `useRecipeForm` + sub-componentes en `kitchenForm/`
  - Layout 2 columnas en desktop, 1 en mobile
  - Emojis → iconos lucide-react
  - Tabs de opciones avanzadas (Restricciones, Cocina, Macros, Utensilios)
  - Loading overlay con tips rotativos
- Header: bug "4 4 receta" corregido
- Tipografía: Fraunces (serif) + Plus Jakarta Sans en layout.tsx
- `FirstRecipeModal`: modal post-primera-receta con CTA a comprar más
- Pricing: 3 testimonios grid (reales o placeholder)

### IA & Costes
- `src/app/api/openai/route.ts` → migrado a **Claude Sonnet 4.6** (`@anthropic-ai/sdk`)
- `src/app/api/recipe-image/route.ts` → **tier por plan**: free=DALL-E 2 512×512, premium=DALL-E 3 1024×1024
- Ahorro estimado: ~60% en texto, ~55% en imágenes free

### Base de datos — Migración tokens → recetas ✅ COMPLETADA
- **Script:** `scripts/migrate-tokens-to-recipes.ts` (`npm run migrate:tokens`)
- **Ejecutada 2026-02-27** sobre proyecto `Buffex-cd1f5`: 32 docs actualizados
  - 30 docs `/user`: `monthly_tokens/extra_tokens` → `monthly_recipes/extra_recipes`, `tokens_reset_date` eliminado
  - 1 doc `/subscripcion`: `tokensIncluded:300` → `recipesIncluded:30`
  - 1 doc `/token_purchases`: `tokensAmount:30` → `recipesAmount:3`
- Dual-read fallback en código (`monthly_recipes ?? floor(monthly_tokens/10)`) — **puede eliminarse** en sesión futura

### Analytics
- GA4 integrado vía `AnalyticsGate` (solo carga si el usuario acepta analytics)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-BXZS1XQGEB` en `.env`
- `src/lib/gtag.ts`: helpers `pageview`, `trackRecipeGenerated`, `trackSubscriptionStarted`, `trackPAYGPurchased`

### Infraestructura
- `next.config.ts`: security headers + WebP/AVIF optimization
- `resend` actualizado a versión estable
- GDPR: ConsentModal rediseñado, granular, ARIA
- **Next.js actualizado a `15.3.9`** (fix CVE-2025-66478)

---

## Pendiente

### Limpieza de código post-migración ✅ COMPLETADA
- [x] Eliminados dual-read fallbacks de `api/openai`, `api/deduct-tokens`, `api/recipe-image`
- [x] Eliminada función `normalizeUserData()` de `user-context.tsx` → cast directo `as CustomUser`
- [x] Eliminado fallback `tokensAmount` de `tokenpurchases-context.tsx` → `.map()` simple
- [x] **Cero referencias** a `monthly_tokens`, `extra_tokens`, `tokens_reset_date` en el código

### Configuración Producción
- [x] `ANTHROPIC_API_KEY` añadida en Vercel Dashboard
- [x] Env vars de Stripe en Vercel dashboard
- [ ] Stripe Dashboard → Branding: logo + color `#F97316`

### Contenido / Conversión
- [ ] Testimonios reales (actualmente son placeholder)
- [ ] Landing: contador dinámico "X recetas generadas" (requiere Firestore counter)

### QA post-deploy
- [ ] Test E2E flujo completo: registro → kitchen → generar receta → upgrade
- [ ] Verificar que GA4 registra eventos (`trackRecipeGenerated`, `trackPAYGPurchased`)
- [ ] Verificar que `FirstRecipeModal` aparece correctamente en primera receta
- [ ] Verificar imágenes: free → DALL-E 2 (512px), premium → DALL-E 3 (1024px)
- [ ] Verificar que recetas generadas usan Claude Sonnet 4.6 (revisar en Anthropic Dashboard)

### Lanzamiento
- [ ] ProductHunt: ficha lista (logo 240px, screenshots, GIF demo)
- [ ] Reddit: r/SideProject, r/spain, r/cocina
- [ ] Hacker News: "Show HN"
