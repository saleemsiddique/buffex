/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */

// app/api/consent/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import "@/lib/firebase-admin";

const POLICY_VERSION =
  process.env.POLICY_VERSION ||
  process.env.NEXT_PUBLIC_POLICY_VERSION ||
  "1.0.0";
const POLICY_UPDATED_AT = process.env.POLICY_UPDATED_AT || null; // ISO string optional

// Helper: permite versiones por tipo vía env vars como POLICY_VERSION_TERMS_OF_SERVICE
function envPolicyVersionForType(type: string) {
  try {
    const key = "POLICY_VERSION_" + type.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    return (process.env as any)[key] || POLICY_VERSION;
  } catch {
    return POLICY_VERSION;
  }
}

// Anonimiza / enmascara una IP (server-side)
function maskIp(rawIp: string | null): string | null {
  if (!rawIp) return null;
  // Si vienen varias IPs (x-forwarded-for), tomar la primera
  const ip = rawIp.split(",")[0].trim();

  // IPv4
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      parts[3] = "0"; // último octeto a 0
      return parts.join(".");
    }
    return ip;
  }

  // IPv6: mantener primeros bloques y truncar el resto
  if (ip.includes(":")) {
    const parts = ip.split(":");
    const keep = parts.slice(0, 4); // conserva primeros 4 bloques
    return keep.join(":") + "::";
  }

  return ip;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Soportamos dos formatos:
    // 1) body.accepted = [{ type, version, granted? }]
    // 2) compatibilidad: body.type + body.version + body.granted
    let {
      accepted,
      type,
      granted,
      user_id: bodyUserId,
      version = "", // Cambiado de null a ""
      details = {}, // Cambiado de null a {}
      origin = "", // Cambiado de null a ""
      ref = "", // Cambiado de null a ""
      path = "", // Cambiado de null a ""
      client_timestamp: bodyClientTimestamp = null, // Renombrado y mantiene null por compatibilidad
    } = body;

    if (!accepted) {
      if (!type || typeof granted !== "boolean" || !bodyUserId) {
        console.error("Campos obligatorios faltantes (compat):", { type, granted, bodyUserId });
        return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
      }
      accepted = [{ type, version: version || envPolicyVersionForType(type), granted, details: details || {} }]; // Asegura details
    } else {
      // validamos estructura mínima
      if (!Array.isArray(accepted) || accepted.length === 0) {
        return NextResponse.json({ error: "accepted debe ser un array no vacío" }, { status: 400 });
      }
      // aseguramos que cada entrada tenga version, granted y details
      accepted = accepted.map((a: any) => ({
        type: a.type,
        version: a.version || envPolicyVersionForType(a.type),
        granted: typeof a.granted === "boolean" ? a.granted : true,
        details: a.details || {}, // Asegura que details sea un objeto si no viene
      }));
    }

    if (!bodyUserId) {
      console.error("Falta user_id en el body");
      return NextResponse.json({ error: "Falta user_id" }, { status: 400 });
    }

    let userId = bodyUserId;
    let isUserAuthenticated = false;

    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
        isUserAuthenticated = true;
      } catch {
        console.warn("Token de autorización no válido. Procediendo con user_id enviado (anónimo).");
      }
    }

    // Obtener IP real desde cabeceras (por detrás de proxies)
    const rawIp =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("fastly-client-ip") ||
      req.headers.get("true-client-ip") ||
      req.headers.get("remote-addr") ||
      null;

    const ip_masked = maskIp(rawIp) || ""; // Asegura que ip_masked no sea null

    // user agent desde cabeceras (más fiable que lo que envíe cliente)
    const serverUserAgent = req.headers.get("user-agent") || ""; // Asegura que serverUserAgent no sea null

    // Si origin/ref/path no vienen en body, intentar obtener de cabeceras
    const originHeader = req.headers.get("origin") || "";
    const refererHeader = req.headers.get("referer") || req.headers.get("referrer") || "";

    const resolvedOrigin = origin || originHeader; // Ya tiene valor por defecto
    const resolvedRef = ref || refererHeader; // Ya tiene valor por defecto
    const resolvedPath = path || ""; // path típicamente lo envía el cliente, si no, ""

    const db = getFirestore();

    const acceptedTypes = (accepted as any[]).map((a) => a.type);

    // Si el cliente mandó un timestamp, lo conservamos. Si no, o si es inválido, puede ser null o una cadena vacía.
    const clientTimestampValue = bodyClientTimestamp ? new Date(bodyClientTimestamp).toISOString() : "";

    const consentData = {
      user_id: userId,
      accepted, // array de { type, version, granted, details? }
      accepted_types: acceptedTypes, // para poder hacer array-contains en consultas por tipo
      // server timestamp (no confiar solo en la del cliente)
      timestamp: FieldValue.serverTimestamp(),
      // conservar la fecha del cliente si la envía (opcional)
      client_timestamp: clientTimestampValue, // Usar la cadena ISO o vacía
      ip_masked,
      user_agent: serverUserAgent,
      meta: {
        origin: resolvedOrigin,
        ref: resolvedRef,
        path: resolvedPath,
      },
      details: details || {}, // Asegura que details sea un objeto
      created_by_authenticated: isUserAuthenticated || false,
    };

    const docRef = await db.collection("consents").add(consentData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error en POST /api/consent:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = getFirestore();
    const consentTypes = ["terms_of_service", "privacy_policy", "cookies_policy"];

    // Una sola query: registro más reciente del usuario (optimización 3→1 query)
    const snapshot = await db
      .collection("consents")
      .where("user_id", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    const consentStatus: Record<string, { version: string; granted: boolean } | null> = {};

    if (snapshot.empty) {
      consentTypes.forEach((type) => { consentStatus[type] = null; });
    } else {
      const acceptedArr: any[] = snapshot.docs[0].data().accepted || [];
      for (const type of consentTypes) {
        // Buscar cualquier entrada del tipo (sin filtrar por granted)
        const entry = acceptedArr.find((e) => e.type === type);
        if (!entry) {
          consentStatus[type] = null;
          continue;
        }
        consentStatus[type] = { version: entry.version || "", granted: !!entry.granted };
      }
    }

    return NextResponse.json({
      ...consentStatus,
      policy_version: POLICY_VERSION,
      policy_updated_at: POLICY_UPDATED_AT || null,
    });
  } catch (error) {
    console.error("Error en GET /api/consent:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}