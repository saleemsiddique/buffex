# Buffex — Monetization Strategy

## Modelo de Precios Aprobado

| Opción | Precio | Recetas/mes | Features |
|--------|--------|-------------|----------|
| **Gratuito** | €0 | 5 | Ingredientes, tiempo, dificultad, tipo comida, comensales |
| **Pay-as-you-go** | €4.99 (único) | +15 recetas | Las mismas del plan activo del usuario |
| **Premium** | €9.99/mes | Ilimitadas | Todo + restricciones dietéticas, estilos de cocina, macros |

## Economía Validada

- Coste real por receta: €0.07 (OpenAI GPT-4 Turbo + DALL-E 3)
- Free: 5 × €0.07 = €0.35/usuario/mes — aceptable para adquisición
- Pay-as-you-go: 15 × €0.07 = €1.05 coste → €4.99 ingreso = **376% margen**
- Premium: 50 recetas promedio × €0.07 = €3.50 → €9.99 = **185% margen**
- ⚠️ Power user riesgo: >143 recetas/mes → coste > €9.99. Monitorizar con Analytics.

## Internamente (sin cambios estructurales)

- 10 tokens = 1 receta (no cambia)
- Free: 50 monthly_tokens = 5 recetas
- Premium: 9999 monthly_tokens = ilimitado funcional (o el valor que ponga el webhook)
- Pay-as-you-go: 150 extra_tokens = 15 recetas

## Stripe Price IDs

### Actuales (mantener en webhook)
- `price_1RwHJCRpBiBhmezm4D1fPQt5` — Premium €7.99/mes (300 tokens) — **DEPRECAR**

### Nuevos (crear en dashboard Stripe)
- `PRICE_PREMIUM_999` — Premium €9.99/mes (999 tokens = ~99 recetas funcionales)
- `PRICE_PAYG_499` — Pay-as-you-go €4.99 único (150 tokens = 15 recetas)

### Archivar
- `price_1RwHKLRpBiBhmezmK1AybT5C` — Pack 30 tokens €0.99
- `price_1RwHL6RpBiBhmezmsEhJyMC1` — Pack 60 tokens €1.99
- `price_1RwHLWRpBiBhmezmY3vPGDxT` — Pack 120 tokens €3.49
- `price_1RwHLrRpBiBhmezmFamEW9Ct` — Pack 250 tokens €6.49
- `price_1RwHMCRpBiBhmezmRzyb4DAm` — Pack 600 tokens €13.99
- `price_1RwHMbRpBiBhmezmgyMbGrJq` — Pack 1200 tokens €24.99

## Decisión de Migración de Features

**Cutoff directo sin aviso** (app nunca lanzada públicamente):
- Dietary restrictions → solo Premium
- Estilos de cocina → solo Premium
- Macros → solo Premium

## Plan de Comunicación Suscriptores €7.99

1. Email a todos los usuarios con `isSubscribed: true` y `subscriptionStatus === 'active'`
2. Informar del cambio de precio de €7.99 → €9.99 con fecha efectiva (30 días de antelación)
3. Oferta: upgrade voluntario con precio bloqueado por 3 meses
