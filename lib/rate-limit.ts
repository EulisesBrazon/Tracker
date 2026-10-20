/**
 * Rate limiting de ventana fija, en memoria.
 *
 * LIMITACIÓN IMPORTANTE: el contador vive en la memoria de la instancia que
 * atiende la petición. En Vercel hay varias instancias efímeras, así que el
 * límite real es "N por ventana por instancia", no un límite global duro.
 *
 * Sirve para lo que se necesita aquí: frenar un bucle descontrolado o un
 * script que se dispare de más. NO sirve como defensa contra un atacante
 * decidido ni contra abuso distribuido. Para un límite global real habría que
 * mover el contador a un almacén compartido (Upstash Redis o similar).
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

/** Evita que el Map crezca sin control en una instancia de vida larga. */
const MAX_BUCKETS = 5000;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, w] of buckets) {
        if (now >= w.resetAt) buckets.delete(k);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }

    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Headers estándar para que el consumidor sepa cuánto margen le queda. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'x-ratelimit-limit': String(result.limit),
    'x-ratelimit-remaining': String(result.remaining),
    'x-ratelimit-reset': String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers['retry-after'] = String(result.retryAfterSeconds);
  }

  return headers;
}
