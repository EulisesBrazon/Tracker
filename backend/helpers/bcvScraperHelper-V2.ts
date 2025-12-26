
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import tls from 'tls';
import { createHash, X509Certificate } from 'crypto';
import { fetchPem, savePem } from '../services';
import { connectToDatabase } from '../../lib/mongodb';

export async function scrapeBcvRateV2() {
  const url = 'https://www.bcv.org.ve/';

  try {
    try {
      await connectToDatabase();
      // console.log('[scrapeBcvRateV2] connectToDatabase(): conexión iniciada');
    } catch (connErr) {
      console.warn('[scrapeBcvRateV2] connectToDatabase() falló (continuando):', (connErr as any)?.message || connErr);
    }
    // Obtener PEM únicamente desde la base de datos (sin fallback a fichero)
    // Nota: es posible que inicialmente no exista registro en la BD; no fallamos inmediatamente
    let bcvCert: Buffer | undefined = undefined;
    let certSource = 'db';
    try {
      const dbPem = await fetchPem('bcv-cert');
      if (!dbPem || !dbPem.pem) {
        // console.log('[scrapeBcvRateV2] No existe PEM en DB (bcv-cert). Se continuará intentando obtener la cadena desde el servidor.');
      } else {
        // console.log('[scrapeBcvRateV2] Loaded PEM from DB (bcv-cert)');
        bcvCert = Buffer.from(dbPem.pem, 'utf8');
      }
    } catch (dbErr) {
      console.error('[scrapeBcvRateV2] Error cargando PEM desde la BD:', (dbErr as any)?.message || dbErr);
      // console.log('[scrapeBcvRateV2] Continuando sin PEM local en DB; se intentará recuperar intermediarios desde el servidor.');
    }

    // Logueamos información útil del certificado para diagnóstico
    try {
      if (bcvCert) {
        const fingerprint = createHash('sha256').update(bcvCert).digest('hex');
        // console.log(`[scrapeBcvRateV2] Cert loaded (${certSource}) (sha256=${fingerprint}, bytes=${bcvCert.length})`);
      } else {
        // console.log('[scrapeBcvRateV2] No hay certificado local cargado desde DB; procediendo sin fingerprint local.');
      }
    } catch (logErr) {
      console.warn('[scrapeBcvRateV2] No se pudo generar fingerprint del certificado:', (logErr as any)?.message || logErr);
    }

    // Creamos el agente combinando los root CAs por defecto de Node con tu certificado
    const defaultRoots: string[] = Array.from(tls.rootCertificates || []);
    // console.log(`[scrapeBcvRateV2] Default root CAs count: ${defaultRoots.length}`);
    const pemString = bcvCert ? bcvCert.toString('utf8') : '';

    // Helper: convierte un buffer DER a PEM
    const derToPem = (der: Buffer) => {
      const b64 = der.toString('base64');
      const lines = b64.match(/.{1,64}/g) || [];
      return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
    };

    // Intenta recuperar la cadena de certificados del servidor (leaf + intermedios)
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;

    const fetchPeerChain = async (hostname: string, portNum: number) => {
      return new Promise<Array<{ pem: string; raw: Buffer }>>((resolve, reject) => {
        const socket = tls.connect({ host: hostname, port: portNum, servername: hostname, rejectUnauthorized: false }, () => {
          try {
            const peer = socket.getPeerCertificate(true) as any;
            const items: Array<{ pem: string; raw: Buffer }> = [];
            // `peer` may be an object with `raw` buffer and an `issuerCertificate` chain
            let current: any = peer;
            const seen = new Set<string>();
            while (current && Object.keys(current).length) {
              if (current.raw && !seen.has(current.raw.toString('base64'))) {
                const rawBuf = Buffer.from(current.raw);
                items.push({ pem: derToPem(rawBuf), raw: rawBuf });
                seen.add(current.raw.toString('base64'));
              }
              if (!current.issuerCertificate || current.issuerCertificate === current) break;
              current = current.issuerCertificate;
            }
            socket.end();
            resolve(items);
          } catch (err) {
            socket.destroy();
            reject(err);
          }
        });
        socket.setTimeout(5000, () => {
          socket.destroy();
          reject(new Error('timeout fetching peer certificate chain'));
        });
        socket.on('error', (err) => {
          reject(err);
        });
      });
    };

    let peerChainPems: string[] = [];
    let combinedCa: string[] = [];
    try {
      const fetched = await fetchPeerChain(host, port);
      // fetched[0] is the leaf; any server-provided intermediates follow
      const serverProvidedPems = fetched.map(f => f.pem);
      peerChainPems = serverProvidedPems.slice(1); // skip leaf
      // Attempt to auto-download intermediates from AIA URLs found in the leaf's raw DER
      const downloadedIntermediates: string[] = [];
      try {
        const leafRaw = fetched[0]?.raw;
        if (leafRaw) {
          const rawStr = leafRaw.toString('latin1');
            // capture common certificate file URLs only to avoid grabbing surrounding garbage
            const urlMatches = Array.from(new Set(Array.from(rawStr.matchAll(/https?:\/\/[^\s\0<>"']+\.(?:crt|cer|der|pem)/ig)).map(m => m[0])));
          if (urlMatches.length) {
            // console.log(`[scrapeBcvRateV2] AIA URLs found in leaf cert: ${urlMatches.join(', ')}`);
            for (const u of urlMatches) {
              try {
                // console.log(`[scrapeBcvRateV2] Downloading possible intermediate from ${u}`);
                const resp = await axios.get(u, { responseType: 'arraybuffer', timeout: 5000 });
                const buf = Buffer.from(resp.data);
                // Heuristics: if UTF-8 text contains PEM header, use as-is; if size looks like DER (starts with 0x30), convert
                const asUtf8 = buf.toString('utf8');
                if (asUtf8.includes('-----BEGIN CERTIFICATE-----')) {
                  downloadedIntermediates.push(asUtf8);
                } else if (buf.length > 50 && buf[0] === 0x30) {
                  downloadedIntermediates.push(derToPem(buf));
                } else {
                  console.warn('[scrapeBcvRateV2] downloaded resource did not look like a cert, skipping');
                }
                // console.log(`[scrapeBcvRateV2] Downloaded intermediate from ${u} (${buf.length} bytes)`);
              } catch (dlErr) {
                console.warn('[scrapeBcvRateV2] fallo al descargar intermediate:', u, (dlErr as any)?.message || dlErr);
              }
            }
            if (downloadedIntermediates.length) {
              // console.log(`[scrapeBcvRateV2] Downloaded intermediates count: ${downloadedIntermediates.length}`);
            }
          } else {
            // console.log('[scrapeBcvRateV2] No AIA URLs found in leaf raw DER');
          }
        }
      } catch (aiaErr) {
        console.warn('[scrapeBcvRateV2] Error extracting/downloading AIA intermediates:', (aiaErr as any)?.message || aiaErr);
      }
      // combined CA: system roots, server-provided intermediates, downloaded intermediates, local PEM (si existe)
      combinedCa = [...defaultRoots, ...peerChainPems, ...(Array.isArray(downloadedIntermediates) ? downloadedIntermediates : [])];
      if (pemString) combinedCa.push(pemString);
      // console.log(`[scrapeBcvRateV2] Fetched peer chain certificates count: ${peerChainPems.length}`);
      // Log details for each fetched certificate
      try {
        peerChainPems.forEach((pem, i) => {
          try {
            const cert = new X509Certificate(pem);
            // console.log(`[scrapeBcvRateV2] Peer cert #${i}: subject=${cert.subject}, issuer=${cert.issuer}, serial=${cert.serialNumber}, validFrom=${cert.validFrom}, validTo=${cert.validTo}, fingerprint256=${cert.fingerprint256}`);
          } catch (cErr) {
            console.warn('[scrapeBcvRateV2] No se pudo parsear peer cert:', (cErr as any)?.message || cErr);
          }
        });
      } catch (logChainErr) {
        console.warn('[scrapeBcvRateV2] Error loggeando la cadena de certificados:', (logChainErr as any)?.message || logChainErr);
      }
      // Peer chain fetched count logged above; not writing files to project per policy
      // console.log(`[scrapeBcvRateV2] Peer chain fetched count: ${peerChainPems.length}`);
      // Log info about local BCV cert file
      try {
        if (pemString) {
          const localCert = new X509Certificate(pemString);
          // console.log(`[scrapeBcvRateV2] Local BCV cert: subject=${localCert.subject}, issuer=${localCert.issuer}, serial=${localCert.serialNumber}, validFrom=${localCert.validFrom}, validTo=${localCert.validTo}, fingerprint256=${localCert.fingerprint256}`);
          } else {
          // console.log('[scrapeBcvRateV2] No hay certificado local para parsear (pemString vacío)');
        }
      } catch (localErr) {
        console.warn('[scrapeBcvRateV2] No se pudo parsear el certificado local bcv-cert.pem:', (localErr as any)?.message || localErr);
      }
      // Test a TLS connection using the combined CA to inspect authorization
      try {
        await new Promise<void>((resolve, reject) => {
          const testSocket = tls.connect({ host, port, servername: host, ca: combinedCa, rejectUnauthorized: true }, () => {
            // console.log(`[scrapeBcvRateV2] TLS test connection: authorized=${(testSocket as any).authorized}, authorizationError=${(testSocket as any).authorizationError}`);
            testSocket.end();
            resolve();
          });
          testSocket.setTimeout(5000, () => {
            testSocket.destroy();
            reject(new Error('timeout during TLS test connection'));
          });
          testSocket.on('error', (err) => reject(err));
        });
      } catch (tlsTestErr) {
        console.warn('[scrapeBcvRateV2] TLS test with combined CA failed:', (tlsTestErr as any)?.message || tlsTestErr);
      }
      // If TLS test succeeded (authorized=true) or we've downloaded intermediates, persist updated PEM to DB
      try {
        const storeIntermediates = [...peerChainPems, ...(Array.isArray(downloadedIntermediates) ? downloadedIntermediates : [])];
        if (storeIntermediates.length) {
          // Recolectar todos los bloques PEM candidatos (intermediates + local)
          const candidateText = storeIntermediates.join('\n') + '\n' + pemString;
          const pemBlockRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
          const allBlocks = Array.from(new Set((candidateText.match(pemBlockRegex) || []).map(b => b.trim())));

          // Normalizar y deduplicar por fingerprint (mantener primer orden de aparición)
          const seen = new Set<string>();
          const normalizedBlocks: string[] = [];
          for (const blk of allBlocks) {
            try {
              const cert = new X509Certificate(blk);
              const fp = cert.fingerprint256;
              if (!seen.has(fp)) {
                seen.add(fp);
                normalizedBlocks.push(blk + '\n');
              }
            } catch (pErr) {
              // Ignorar bloques que no se puedan parsear
            }
          }

          if (normalizedBlocks.length === 0) {
            // console.log('[scrapeBcvRateV2] No se encontraron bloques PEM válidos para guardar en DB');
          } else {
            const newPem = normalizedBlocks.join('\n');
            try {
              const existing = await fetchPem('bcv-cert');
              const existingBlocks = (existing && existing.pem) ? (existing.pem.match(pemBlockRegex) || []).map(b => b.trim()) : [];
              // comparar fingerprints de existing vs new
              const existingFps = new Set<string>();
              for (const eb of existingBlocks) {
                try { existingFps.add(new X509Certificate(eb).fingerprint256); } catch { }
              }
              const newFps = new Set<string>();
              for (const nb of normalizedBlocks) {
                try { newFps.add(new X509Certificate(nb).fingerprint256); } catch { }
              }
              const same = existingFps.size === newFps.size && Array.from(newFps).every(f => existingFps.has(f));
              if (!same) {
                await savePem('bcv-cert', newPem);
                // console.log('[scrapeBcvRateV2] Replaced PEM in DB (bcv-cert) with normalized unique blocks');
              } else {
                // console.log('[scrapeBcvRateV2] PEM en DB ya contiene los mismos certificados; no se actualiza');
              }
            } catch (innerErr) {
              console.warn('[scrapeBcvRateV2] Error comparando/guardando PEM en DB:', (innerErr as any)?.message || innerErr);
            }
          }
        }
      } catch (upErr) {
        console.warn('[scrapeBcvRateV2] Failed to prepare PEM for saving into DB:', (upErr as any)?.message || upErr);
      }
    } catch (chainErr) {
      console.warn('[scrapeBcvRateV2] No se pudo obtener la cadena de certificados del servidor:', (chainErr as any)?.message || chainErr);
    }

    // Orden: system roots, fetched intermediates, provided BCV cert (ensure trusted anchors present)
    // (combinedCa already declared above)

    // Intentos de conexión TLS con distintos trust stores / fallback
    let html: string | undefined;
    let lastErr: any = null;

    const doRequest = async (agent: https.Agent) => {
      const resp = await axios.get(url, {
        httpsAgent: agent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
        },
        timeout: 10000
      });
      return resp.data;
    };

    // 1) Intento: combinación de root CA del sistema + PEM proporcionado
    try {
      const agent1 = new https.Agent({ ca: combinedCa, rejectUnauthorized: true, keepAlive: true });
      html = await doRequest(agent1);
    } catch (e1) {
      lastErr = e1;
      console.warn('[scrapeBcvRateV2] Intento 1 (combined CA) falló:', (e1 as any)?.code || (e1 as any)?.message || e1);

      // 2) Intento: sólo root CA del sistema (sin PEM personalizado)
      try {
        const agent2 = new https.Agent({ ca: defaultRoots, rejectUnauthorized: true, keepAlive: true });
        html = await doRequest(agent2);
        // console.log('[scrapeBcvRateV2] Intento 2 (system root CAs) tuvo éxito');
      } catch (e2) {
        lastErr = e2;
        console.warn('[scrapeBcvRateV2] Intento 2 (system root CAs) falló:', (e2 as any)?.code || (e2 as any)?.message || e2);

        // 3) Fallback inseguro opcional (solo si se habilita explícitamente mediante variable de entorno)
        if (process.env.BCV_ALLOW_INSECURE === '1') {
          console.warn('[scrapeBcvRateV2] BCV_ALLOW_INSECURE=1 -> intentando petición insegura (rejectUnauthorized=false)');
          const agent3 = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
          html = await doRequest(agent3);
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
    if (!rawDolar) {
      throw new Error('No se pudo localizar el elemento del precio en el HTML');
    }

    // Limpieza: quitamos puntos de miles y cambiamos coma por punto decimal
    const normalizedDolar = rawDolar.replace(/\./g, '').replace(',', '.');
    const dateValue = $('.pull-right.dinpro.center span.date-display-single').attr('content');

    return {
      valor: parseFloat(normalizedDolar),
      fecha: dateValue,
      fuente: 'Banco Central de Venezuela'
    };

  } catch (error) {
    const err = error as any;
    // Si el error es de certificado, lo indicamos específicamente
    if (err.code === 'EPROTO' || err.code === 'CERT_HAS_EXPIRED') {
      console.error('Error de certificado: Revisa si el archivo .pem es correcto o ha expirado.');
    }
    console.error('Error detallado:', err.code || err.message || err);
    throw new Error(`Error conectando al BCV: ${err.message || err}`);
  }
}
