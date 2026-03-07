/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth, db } from '@/lib/firebase-admin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
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
    } catch {
      return NextResponse.json({ error: 'Token de autenticación inválido' }, { status: 401 });
    }

    // Obtener datos del usuario para determinar tier de imagen
    const userDoc = await db.collection('user').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    const userData = userDoc.data();

    // Determinar tier: premium si tiene suscripción activa o extra recipes
    // Nota: NO bloqueamos por recetas restantes — la imagen se genera tras deducir el token
    const isPremium = userData?.isSubscribed === true;

    const body = await request.json();
    const recipe = body?.recipe;

    if (!recipe) {
      console.warn('[API /api/recipe-image] Falta recipe');
      return NextResponse.json({ error: 'Falta el objeto recipe en el cuerpo de la petición.' }, { status: 400 });
    }

    const titulo: string = recipe.titulo ?? '';
    const descripcion: string = recipe.descripcion ?? '';
    const estilo: string | null = recipe.estilo ?? null;
    const ingredientes: Array<{ nombre: string; cantidad?: string; unidad?: string | null }>
      = Array.isArray(recipe.ingredientes) ? recipe.ingredientes : [];
    const instrucciones: Array<{ paso: number; texto: string }>
      = Array.isArray(recipe.instrucciones) ? recipe.instrucciones : [];

    const ingredientesLista = ingredientes
      .map((ing) => ing?.nombre)
      .filter(Boolean)
      .slice(0, 12)
      .join(', ');

    // Extraer los últimos 2 pasos: describen el emplatado y presentación final
    const ultimosPasos = instrucciones
      .slice(-2)
      .map((p) => p.texto)
      .filter(Boolean)
      .join(' ');

    // Prompt completo para DALL-E 3 (límite 4000 chars)
    // Prompt compacto para DALL-E 2 (límite estricto de 1000 chars)
    const promptDalle2 = `Hyperrealistic food photo of "${titulo.slice(0, 60)}". ${descripcion.slice(0, 150)} ${ultimosPasos ? `Final look: ${ultimosPasos.slice(0, 150)}. ` : ''}${estilo ? `${estilo} cuisine. ` : ''}Natural window light, home-cooked look, soft focus background. No text, no watermark, no hands.`.slice(0, 950);

    let b64: string | undefined;

    if (isPremium) {
      // PREMIUM: DALL-E 3 1024×1024
      const finalDescription = ultimosPasos
        ? `The finished dish looks like this: ${ultimosPasos}`
        : 'The dish is shown as a finished, plated meal — ingredients fully cooked and combined as they would appear when served.';
      const promptDalle3 = `Professional food photography of "${titulo}". ${descripcion}${estilo ? ` ${estilo} cuisine style.` : ''} ${finalDescription} Natural soft window light, shallow depth of field, home-cooked aesthetic with realistic imperfections. No raw ingredients shown separately, no whole unprocessed items. No text, no watermark, no hands.`;
      try {
        const result = await openai.images.generate({
          model: 'dall-e-3',
          prompt: promptDalle3,
          size: '1024x1024',
          n: 1,
          response_format: 'b64_json',
        } as any);
        b64 = (result as any)?.data?.[0]?.b64_json;
      } catch (err) {
        console.error('[API /api/recipe-image] dall-e-3 falló (premium)', err);
      }
    } else {
      // FREE: DALL-E 2 512×512, sin fallback caro
      try {
        const result = await openai.images.generate({
          model: 'dall-e-2',
          prompt: promptDalle2,
          size: '512x512',
          n: 1,
          response_format: 'b64_json',
        } as any);
        b64 = (result as any)?.data?.[0]?.b64_json;
      } catch (err) {
        console.error('[API /api/recipe-image] dall-e-2 falló (free)', err);
        // Free tier: no fallback caro, devolver sin imagen (no es un error crítico)
        return NextResponse.json({ img_url: '' });
      }
    }

    if (!b64) {
      return NextResponse.json({ img_url: '' });
    }

    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ img_url: dataUrl });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno al generar la imagen.', details: error?.message }, { status: 500 });
  }
}
