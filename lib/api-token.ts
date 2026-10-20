/**
 * Autenticación máquina-a-máquina para los endpoints públicos de tasas.
 *
 * El consumidor (inventarioPollo) envía el header `x-api-token` con el mismo
 * valor que `API_TOKEN` en este proyecto. No se usa la cookie JWT porque no
 * hay navegador ni sesión de usuario en ese flujo.
 */

export const API_TOKEN_HEADER = 'x-api-token';

/**
 * Comparación en tiempo constante entre dos cadenas.
 *
 * No se usa `crypto.timingSafeEqual` porque este helper también corre en el
 * middleware, que se ejecuta en el runtime Edge y no expone `node:crypto`.
 * La implementación recorre siempre la longitud máxima y acumula las
 * diferencias con OR, de modo que el tiempo no depende de en qué byte falla.
 *
 * Filtra la longitud de la cadena, cosa aceptada en este tipo de comparación.
 */
export function safeCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  let diff = aBytes.length ^ bBytes.length;
  const max = Math.max(aBytes.length, bBytes.length);

  for (let i = 0; i < max; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }

  return diff === 0;
}

/** Lee el token configurado. Devuelve null si no está definido o está vacío. */
export function getConfiguredApiToken(): string | null {
  const token = process.env.API_TOKEN;
  if (!token || token.trim().length === 0) return null;
  return token;
}

/**
 * Valida el header `x-api-token` de una petición.
 *
 * Si `API_TOKEN` no está configurado, devuelve false: es preferible que los
 * endpoints públicos queden cerrados a que un despliegue sin la variable los
 * deje abiertos a todo el mundo.
 */
export function isValidApiToken(req: Request): boolean {
  const configured = getConfiguredApiToken();
  if (!configured) return false;

  const provided = req.headers.get(API_TOKEN_HEADER);
  if (!provided) return false;

  return safeCompare(provided, configured);
}

/**
 * Extrae un identificador estable del llamante para el rate limiting,
 * sin exponer el token completo.
 */
export function getCallerKey(req: Request): string {
  const token = req.headers.get(API_TOKEN_HEADER) ?? 'anon';
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  return `${token.slice(0, 8)}:${ip}`;
}
