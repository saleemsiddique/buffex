# Buffex — MCP Plugins Recommendations

## Project-Scoped (`.mcp.json` en raíz del proyecto)

### Stripe MCP
Permite crear/listar productos y precios directamente desde Claude sin abrir el dashboard.

Crear `.mcp.json` en la raíz del proyecto:
```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}"
      }
    }
  }
}
```

**Uso típico:**
- Crear productos y precios sin abrir Stripe Dashboard
- Listar price IDs directamente
- Verificar suscriptores y pagos

## Global (ya configurados)

### context7 ✓ (ya instalado)
- **Uso:** En TODOS los cambios de código para verificar best practices y documentación actualizada
- **Comandos:** `use context7` en cualquier query técnica

### playwright ✓ (ya instalado)
- **Uso:** Verificar flujos E2E tras cada fase, screenshots de UI
- **Comandos:** Disponible vía `playwright` MCP

## Por Instalar (Opcionales)

### Firebase MCP (para operaciones Firestore)
```bash
npx @firebase/mcp
```
Permite queries directas a Firestore desde Claude (útil para debugging y operaciones manuales).

### Vercel MCP (para deployments)
```bash
npx @vercel/mcp
```
Permite ver deployments, logs y variables de entorno desde Claude.

## Nota Importante

Los MCPs de proyecto (`.mcp.json`) son específicos del workspace y no se commitean al repositorio para evitar exponer API keys. Añadir `.mcp.json` al `.gitignore` si se almacenan secrets inline (usar variables de entorno en su lugar).
