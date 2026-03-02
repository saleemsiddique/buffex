/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/openai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth, db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { buildStaticInstructions, buildDynamicInput } from '@/lib/buildRecipePrompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Timeout de 30 segundos para la llamada a Claude
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Claude request timeout after 30s')), ms)
    ),
  ]);
}

export async function POST(request: NextRequest) {
    const languageCode = request.headers.get("accept-language")?.split(",")[0] || "es";

    try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let uid: string;

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } catch (authError) {
      console.error('Error al verificar el token de autenticación:', authError);
      return NextResponse.json({ error: 'Token de autenticación inválido' }, { status: 401 });
    }

    // Validar recetas disponibles ANTES de llamar a Claude
    const userDoc = await db.collection('user').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    const userData = userDoc.data();
    const totalRecipes = (userData?.monthly_recipes || 0) + (userData?.extra_recipes || 0);
    if (totalRecipes < 1) {
      return NextResponse.json({
        error: 'Recetas insuficientes',
        available: totalRecipes
      }, { status: 402 });
    }

    const body = await request.json();

    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

    const completion = await withTimeout(
      anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: 'Eres un ayudante de recetas experto, preciso y que sigue instrucciones al pie de la letra. Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildStaticInstructions(languageCode),
              cache_control: { type: 'ephemeral' },
            },
            {
              type: 'text',
              text: buildDynamicInput(body),
            },
          ],
        }],
      }, {
        headers: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
      }),
      30000
    );

    const text = completion.content[0].type === 'text' ? completion.content[0].text : '{}';
    // Limpiar posibles marcadores de markdown que Claude pueda añadir
    const cleanText = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Error al parsear la respuesta de IA:', parseError, 'Raw text:', cleanText);
      return NextResponse.json(
        { error: 'Respuesta de IA no es JSON válido', raw: cleanText, parseError: (parseError as Error).message },
        { status: 502 }
      );
    }

    if (!data.receta) {
      console.error('La respuesta de IA no contiene la clave "receta":', data);
      return NextResponse.json(
        { error: 'La respuesta de IA no devolvió la estructura esperada (falta "receta")', raw: data },
        { status: 502 }
      );
    }

    // Incrementar contador global de recetas generadas (fire-and-forget)
    db.collection('stats').doc('global').set(
      { total_recipes: FieldValue.increment(1) },
      { merge: true }
    ).catch(() => {/* non-critical */});

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error en /api/openai:', err);
    if (err.message?.includes('timeout')) {
      return NextResponse.json({ error: 'La generación de receta tardó demasiado. Por favor inténtalo de nuevo.' }, { status: 504 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
