/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth, db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { buildStaticInstructions, buildDynamicInput } from '@/lib/buildRecipePrompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const languageCode = request.headers.get('accept-language')?.split(',')[0] || 'es';

  // Parse body before creating the stream (request body can only be read once)
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Cuerpo de petición inválido' })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const authHeader = request.headers.get('Authorization');
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Auth
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          sendEvent({ type: 'error', message: 'Token de autenticación requerido' });
          controller.close();
          return;
        }

        const idToken = authHeader.split('Bearer ')[1];
        let uid: string;

        try {
          const decoded = await auth.verifyIdToken(idToken);
          uid = decoded.uid;
        } catch {
          sendEvent({ type: 'error', message: 'Token de autenticación inválido' });
          controller.close();
          return;
        }

        // Firestore transaction: deduct 1 recipe
        const userRef = db.collection('user').doc(uid);
        let updatedUser: { monthly_recipes: number; extra_recipes: number };

        try {
          updatedUser = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('Usuario no encontrado');

            const userData = userDoc.data()!;
            const monthly = userData.monthly_recipes || 0;
            const extra = userData.extra_recipes || 0;
            const total = monthly + extra;

            if (total < 1) throw new Error('Recetas insuficientes');

            let newMonthly = monthly;
            let newExtra = extra;

            // Deduct from monthly first, then extra
            if (newMonthly > 0) {
              newMonthly -= 1;
            } else {
              newExtra -= 1;
            }

            transaction.update(userRef, {
              monthly_recipes: newMonthly,
              extra_recipes: newExtra,
            });

            return { monthly_recipes: newMonthly, extra_recipes: newExtra };
          });
        } catch (err: any) {
          const msg = err.message?.includes('insuficientes')
            ? 'Recetas insuficientes'
            : err.message === 'Usuario no encontrado'
            ? 'Usuario no encontrado'
            : 'Error al deducir receta';
          sendEvent({ type: 'error', message: msg });
          controller.close();
          return;
        }

        sendEvent({ type: 'deducted', updatedUser });

        // Build prompt and stream from Anthropic (with prompt caching on static block)
        const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

        const sdkStream = anthropic.messages.stream({
          model,
          max_tokens: 4096,
          system:
            'Eres un ayudante de recetas experto, preciso y que sigue instrucciones al pie de la letra. Responde ÚNICAMENTE con JSON válido, sin texto adicional ni markdown.',
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
        });

        for await (const event of sdkStream) {
          if (
            event.type === 'content_block_delta' &&
            (event as any).delta?.type === 'text_delta'
          ) {
            const text = (event as any).delta.text as string;
            if (text) {
              sendEvent({ type: 'chunk', text });
            }
          }
        }

        // Increment stats counter (fire-and-forget)
        db.collection('stats')
          .doc('global')
          .set({ total_recipes: FieldValue.increment(1) }, { merge: true })
          .catch(() => {/* non-critical */});

        sendEvent({ type: 'done' });
        controller.close();
      } catch (err: any) {
        console.error('Error en /api/generate:', err);
        try {
          const sendEvent2 = (data: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };
          sendEvent2({ type: 'error', message: err.message || 'Error interno del servidor' });
        } catch {
          // controller may already be closed
        }
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
