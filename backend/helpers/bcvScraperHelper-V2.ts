import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import tls from 'tls';
import { X509Certificate } from 'crypto';
import { fetchPem } from '../services/getPem';
import { savePem } from '../services/UpdatePem';
import { connectToDatabase } from '../../lib/mongodb';

const BCV_URL = 'https://www.bcv.org.ve/';
const PEM_KEY_NAME = 'bcv-cert';
const PEM_BLOCK_REGEX = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
const MAX_AIA_DEPTH = 4;
const MAX_CERT_BYTES = 512 * 1024;

const TLS_CERT_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_UNTRUSTED',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'EPROTO',
]);

export function derToPem(der: Buffer): string {
  const b64 = der.toString('base64');
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
}

export function splitPemBlocks(pemText: string): string[] {
  return (pemText.match(PEM_BLOCK_REGEX) || []).map((block) => block.trim() + '\n');
}

function addValidHttpUrl(candidate: string, target: Set<string>): void {
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      target.add(parsed.toString());
    }
  } catch {
    // Ignore malformed URLs
  }
}

/**
 * Extracts Authority Information Access (AIA) CA Issuers URLs from a certificate.
 * Uses OpenSSL's ASN.1 parser via `X509Certificate.infoAccess` first so binary DER
 * extensions (such as CRL Distribution Points) can never corrupt extracted URLs.
 * Falls back to strict printable-ASCII scanning only if `infoAccess` yields nothing.
 */
export function extractAiaIssuerUrls(certInput: Buffer | X509Certificate): string[] {
  const urls = new Set<string>();

  let parsedCert: X509Certificate | null = null;
  if (certInput instanceof X509Certificate) {
    parsedCert = certInput;
  } else {
    try {
      parsedCert = new X509Certificate(certInput);
    } catch {
      parsedCert = null;
    }
  }

  if (parsedCert?.infoAccess) {
    const caIssuerMatches = parsedCert.infoAccess.matchAll(/CA Issuers\s*-\s*URI:\s*(https?:\/\/[^\s\r\n]+)/gi);
    for (const match of caIssuerMatches) {
      if (match[1]) addValidHttpUrl(match[1], urls);
    }
  }

  if (urls.size > 0) {
    return Array.from(urls);
  }

  const rawBuf = certInput instanceof X509Certificate ? certInput.raw : certInput;
  const rawStr = rawBuf.toString('latin1');
  const asciiChunks = rawStr.match(/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g) ?? [];
  for (const chunk of asciiChunks) {
    const subChunks = chunk.split(/(?=https?:\/\/)/i);
    for (const sub of subChunks) {
      const match = sub.match(/^https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+?\.(?:crt|cer|der|pem)/i);
      if (match) addValidHttpUrl(match[0], urls);
    }
  }

  return Array.from(urls);
}

/**
 * Normalizes PEM blocks into a deduplicated bundle of valid, non-expired X.509 certificates.
 */
export function normalizePemBundle(pemSources: string[], now: Date = new Date()): string {
  const nowMs = now.getTime();
  const seenFingerprints = new Set<string>();
  const normalizedBlocks: string[] = [];

  for (const source of pemSources) {
    for (const block of splitPemBlocks(source)) {
      try {
        const cert = new X509Certificate(block);
        const validToMs = Date.parse(cert.validTo);
        if (Number.isFinite(validToMs) && validToMs <= nowMs) {
          continue;
        }
        if (!seenFingerprints.has(cert.fingerprint256)) {
          seenFingerprints.add(cert.fingerprint256);
          normalizedBlocks.push(block);
        }
      } catch {
        // Ignore unparseable PEM blocks
      }
    }
  }

  return normalizedBlocks.join('\n');
}

function getFingerprints(pemText: string): Set<string> {
  const fps = new Set<string>();
  for (const block of splitPemBlocks(pemText)) {
    try {
      fps.add(new X509Certificate(block).fingerprint256);
    } catch {
      // Ignore unparseable blocks
    }
  }
  return fps;
}

export function isTlsCertificateError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: unknown; message?: unknown };
  if (typeof err.code === 'string' && TLS_CERT_ERROR_CODES.has(err.code)) {
    return true;
  }
  if (typeof err.message === 'string') {
    return /certificate|unable to verify|self[- ]signed|unable to get (local )?issuer/i.test(err.message);
  }
  return false;
}

function parseDownloadedCertificates(buf: Buffer): string[] {
  const asUtf8 = buf.toString('utf8');
  if (asUtf8.includes('-----BEGIN CERTIFICATE-----')) {
    return splitPemBlocks(asUtf8);
  }
  if (buf.length > 50 && buf[0] === 0x30) {
    return [derToPem(buf)];
  }
  return [];
}

async function fetchPeerChain(hostname: string, portNum: number): Promise<Array<{ pem: string; raw: Buffer }>> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host: hostname, port: portNum, servername: hostname, rejectUnauthorized: false },
      () => {
        try {
          const peer = socket.getPeerCertificate(true) as {
            raw?: Buffer;
            issuerCertificate?: unknown;
          };
          const items: Array<{ pem: string; raw: Buffer }> = [];
          let current: { raw?: Buffer; issuerCertificate?: unknown } | undefined = peer;
          const seen = new Set<string>();

          while (current && Object.keys(current).length > 0) {
            if (current.raw) {
              const key = current.raw.toString('base64');
              if (!seen.has(key)) {
                const rawBuf = Buffer.from(current.raw);
                items.push({ pem: derToPem(rawBuf), raw: rawBuf });
                seen.add(key);
              }
            }
            const next = current.issuerCertificate as
              | { raw?: Buffer; issuerCertificate?: unknown }
              | undefined;
            if (!next || next === current) break;
            current = next;
          }

          socket.end();
          resolve(items);
        } catch (err) {
          socket.destroy();
          reject(err);
        }
      }
    );

    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(new Error('timeout fetching peer certificate chain'));
    });

    socket.on('error', (err) => {
      reject(err);
    });
  });
}

function isIssuedByTrustedRoot(cert: X509Certificate, trustedRoots: X509Certificate[]): boolean {
  return trustedRoots.some((root) => {
    try {
      return cert.checkIssued(root);
    } catch {
      return false;
    }
  });
}

async function downloadAiaIntermediates(seedCerts: Buffer[], defaultRootPems: string[]): Promise<string[]> {
  const downloadedPems: string[] = [];
  const visitedUrls = new Set<string>();
  const seenFingerprints = new Set<string>();
  const trustedRoots: X509Certificate[] = [];
  for (const pem of defaultRootPems) {
    try {
      trustedRoots.push(new X509Certificate(pem));
    } catch {
      // Ignore unparseable system root entries
    }
  }

  const queue: Array<{ raw: Buffer; depth: number }> = seedCerts.map((raw) => ({ raw, depth: 0 }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= MAX_AIA_DEPTH) continue;

    const aiaUrls = extractAiaIssuerUrls(current.raw);
    for (const aiaUrl of aiaUrls) {
      if (visitedUrls.has(aiaUrl)) continue;
      visitedUrls.add(aiaUrl);

      // Node's X509Certificate does not parse PKCS#7 bundles (.p7c/.p7b)
      if (/\.p7[bc](?:$|[?#])/i.test(aiaUrl)) continue;

      try {
        const resp = await axios.get<ArrayBuffer>(aiaUrl, {
          responseType: 'arraybuffer',
          timeout: 5000,
          maxContentLength: MAX_CERT_BYTES,
        });
        const buf = Buffer.from(resp.data);
        const candidates = parseDownloadedCertificates(buf);
        if (candidates.length === 0) {
          console.warn('[scrapeBcvRateV2] El recurso AIA descargado no parece un certificado válido:', aiaUrl);
          continue;
        }

        for (const pem of candidates) {
          try {
            const cert = new X509Certificate(pem);
            if (seenFingerprints.has(cert.fingerprint256)) continue;
            seenFingerprints.add(cert.fingerprint256);
            downloadedPems.push(pem);

            if (cert.subject !== cert.issuer && !isIssuedByTrustedRoot(cert, trustedRoots)) {
              queue.push({ raw: cert.raw, depth: current.depth + 1 });
            }
          } catch (certErr) {
            const message = certErr instanceof Error ? certErr.message : String(certErr);
            console.warn('[scrapeBcvRateV2] Certificado AIA inválido descargado desde', aiaUrl, message);
          }
        }
      } catch (dlErr) {
        const message = dlErr instanceof Error ? dlErr.message : String(dlErr);
        console.warn('[scrapeBcvRateV2] Falló al descargar intermedio AIA:', aiaUrl, message);
      }
    }
  }

  return downloadedPems;
}

async function persistPemIfChanged(pemSources: string[], existingPem: string): Promise<void> {
  const newPem = normalizePemBundle(pemSources);
  if (!newPem) return;

  const existingFps = getFingerprints(existingPem);
  const newFps = getFingerprints(newPem);
  const unchanged =
    existingFps.size === newFps.size && Array.from(newFps).every((fp) => existingFps.has(fp));

  if (!unchanged) {
    await savePem(PEM_KEY_NAME, newPem);
  }
}

async function fetchBcvHtml(url: string, options: https.AgentOptions): Promise<string> {
  const agent = new https.Agent({ ...options, keepAlive: false });
  try {
    const resp = await axios.get<string>(url, {
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 10000,
    });
    return resp.data;
  } finally {
    agent.destroy();
  }
}

export async function scrapeBcvRateV2() {
  try {
    try {
      await connectToDatabase();
    } catch (connErr) {
      const message = connErr instanceof Error ? connErr.message : String(connErr);
      console.warn('[scrapeBcvRateV2] connectToDatabase() falló (continuando):', message);
    }

    let existingPem = '';
    try {
      const dbPem = await fetchPem(PEM_KEY_NAME);
      if (dbPem?.pem) {
        existingPem = dbPem.pem;
      }
    } catch (dbErr) {
      const message = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error('[scrapeBcvRateV2] Error cargando PEM desde la BD:', message);
    }

    const defaultRoots: string[] = Array.from(tls.rootCertificates || []);
    const dbCertBlocks = splitPemBlocks(normalizePemBundle(existingPem ? [existingPem] : []));

    let html: string | undefined;
    let lastErr: unknown = null;

    // 1) Fast path: system roots + cached intermediate certificates from DB
    try {
      html = await fetchBcvHtml(BCV_URL, {
        ca: [...defaultRoots, ...dbCertBlocks],
        rejectUnauthorized: true,
      });
    } catch (e1) {
      lastErr = e1;
      const errCode = (e1 as { code?: string; message?: string })?.code || (e1 instanceof Error ? e1.message : String(e1));
      console.warn('[scrapeBcvRateV2] Intento 1 (system roots + DB PEM) falló:', errCode);

      // 2) On TLS/certificate error, fetch the live peer chain and download missing AIA intermediates
      if (isTlsCertificateError(e1)) {
        try {
          const parsedUrl = new URL(BCV_URL);
          const host = parsedUrl.hostname;
          const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;

          const fetched = await fetchPeerChain(host, port);
          const peerIntermediates = fetched.slice(1).map((item) => item.pem);
          const downloadedIntermediates = await downloadAiaIntermediates(
            fetched.map((item) => item.raw),
            defaultRoots
          );
          const freshIntermediates = [...peerIntermediates, ...downloadedIntermediates];

          if (freshIntermediates.length > 0) {
            try {
              html = await fetchBcvHtml(BCV_URL, {
                ca: [...defaultRoots, ...freshIntermediates],
                rejectUnauthorized: true,
              });
              try {
                await persistPemIfChanged(freshIntermediates, existingPem);
              } catch (saveErr) {
                const msg = saveErr instanceof Error ? saveErr.message : String(saveErr);
                console.warn('[scrapeBcvRateV2] Error guardando PEM actualizado en DB:', msg);
              }
            } catch (eFresh) {
              lastErr = eFresh;
              if (dbCertBlocks.length > 0) {
                html = await fetchBcvHtml(BCV_URL, {
                  ca: [...defaultRoots, ...freshIntermediates, ...dbCertBlocks],
                  rejectUnauthorized: true,
                });
                try {
                  await persistPemIfChanged([...freshIntermediates, ...dbCertBlocks], existingPem);
                } catch (saveErr) {
                  const msg = saveErr instanceof Error ? saveErr.message : String(saveErr);
                  console.warn('[scrapeBcvRateV2] Error guardando PEM combinado en DB:', msg);
                }
              } else {
                throw eFresh;
              }
            }
          }
        } catch (chainErr) {
          lastErr = chainErr;
          const msg = chainErr instanceof Error ? chainErr.message : String(chainErr);
          console.warn('[scrapeBcvRateV2] Falló la recuperación automática de cadena TLS/AIA:', msg);
        }
      }

      // 3) Fallback: system root CAs only (in case cached DB PEM caused a conflict)
      if (!html && dbCertBlocks.length > 0) {
        try {
          html = await fetchBcvHtml(BCV_URL, {
            ca: defaultRoots,
            rejectUnauthorized: true,
          });
        } catch (e3) {
          lastErr = e3;
          const code = (e3 as { code?: string; message?: string })?.code || (e3 instanceof Error ? e3.message : String(e3));
          console.warn('[scrapeBcvRateV2] Intento 3 (system root CAs) falló:', code);
        }
      }

      // 4) Optional explicit insecure fallback (only if enabled via env var)
      if (!html) {
        if (process.env.BCV_ALLOW_INSECURE === '1') {
          console.warn('[scrapeBcvRateV2] BCV_ALLOW_INSECURE=1 -> intentando petición insegura (rejectUnauthorized=false)');
          html = await fetchBcvHtml(BCV_URL, { rejectUnauthorized: false });
        } else {
          throw lastErr;
        }
      }
    }

    if (!html) {
      throw lastErr || new Error('Respuesta vacía al solicitar BCV');
    }

    const $ = cheerio.load(html);

    // --- Lógica de extracción ---
    const rawDolar = $('#dolar strong').text().trim();
    const rawEuro = $('#euro strong').text().trim();
    if (!rawDolar) {
      throw new Error('No se pudo localizar el elemento del precio del dólar en el HTML');
    }

    // Limpieza: quitamos puntos de miles y cambiamos coma por punto decimal
    const normalizedDolar = rawDolar.replace(/\./g, '').replace(',', '.');
    const normalizedEuro = rawEuro ? rawEuro.replace(/\./g, '').replace(',', '.') : '';
    const dateValue = $('.pull-right.dinpro.center span.date-display-single').attr('content');

    const valorDolar = parseFloat(normalizedDolar);
    if (!Number.isFinite(valorDolar) || valorDolar <= 0) {
      throw new Error(`Valor del dólar inválido extraído del BCV: "${rawDolar}"`);
    }

    const parsedEuro = normalizedEuro ? parseFloat(normalizedEuro) : 0;
    const valorEuro = Number.isFinite(parsedEuro) && parsedEuro > 0 ? parsedEuro : 0;

    return {
      valor: valorDolar,
      valorDolar,
      rawDolar,
      valorEuro,
      rawEuro,
      fecha: dateValue,
      fuente: 'Banco Central de Venezuela',
    };
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'EPROTO' || err.code === 'CERT_HAS_EXPIRED') {
      console.error('Error de certificado: Revisa si el certificado almacenado es correcto o ha expirado.');
    }
    console.error('Error detallado:', err.code || err.message || err);
    throw new Error(`Error conectando al BCV: ${err.message || err}`);
  }
}
