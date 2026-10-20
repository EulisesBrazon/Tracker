import { NextResponse } from 'next/server';
import { getCallerKey, isValidApiToken } from './api-token';
import { rateLimit, rateLimitHeaders } from './rate-limit';

/**
 * Puerta de entrada común de los endpoints bajo `/api/public/*`.
 *
 * El middleware ya rechaza las peticiones sin token válido, pero la
 * comprobación se repite aquí a propósito: si algún día cambia el `matcher`
 * del middleware, estos endpoints no deben quedar abiertos por accidente.
 */

export const PUBLIC_RATE_LIMIT = 60;
export const PUBLIC_RATE_WINDOW_MS = 60_000;

type GuardResult =
  | { ok: false; response: NextResponse }
  | { ok: true; headers: Record<string, string> };

export function guardPublicRequest(req: Request): GuardResult {
  if (!isValidApiToken(req)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      ),
    };
  }

  const limit = rateLimit(getCallerKey(req), PUBLIC_RATE_LIMIT, PUBLIC_RATE_WINDOW_MS);
  const headers = rateLimitHeaders(limit);

  if (!limit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Demasiadas peticiones' },
        { status: 429, headers }
      ),
    };
  }

  return { ok: true, headers };
}

/**
 * Traduce un error del dominio a una respuesta HTTP.
 *
 * Los mensajes de validación del servicio se devuelven tal cual con 400
 * porque son útiles para quien integra. Cualquier otro error se enmascara:
 * un fallo de conexión a Mongo no debe filtrar la cadena de conexión.
 */
export function publicApiError(
  err: unknown,
  headers: Record<string, string> = {}
): NextResponse {
  const message = err instanceof Error ? err.message : 'Error interno';
  const esValidacion =
    message.includes('requerido') ||
    message.includes('requeridos') ||
    message.includes('Formato') ||
    message.includes('debe ser menor');

  if (esValidacion) {
    return NextResponse.json({ success: false, error: message }, { status: 400, headers });
  }

  console.error('[public-api]', err);
  return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500, headers });
}
