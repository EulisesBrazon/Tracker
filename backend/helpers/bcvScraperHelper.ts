import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

//sin certificado SSL valido para desarrollo local

export async function scrapeBcvRate() {
  const url = 'https://www.bcv.org.ve/';

  // Creamos un agente personalizado que solo usaremos para el BCV
  const customAgent = new https.Agent({
    rejectUnauthorized: false, // Ignora el error de "unable to verify first certificate"
    keepAlive: true            // Mejora el rendimiento si haces varias peticiones
  });

  try {
    const { data: html } = await axios.get(url, {
      httpsAgent: customAgent,
      headers: {
        // Un User-Agent real es vital para que el servidor no te identifique como bot
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 10000 // 10 segundos de espera máximo
    });

    const $ = cheerio.load(html);

    // --- Tu lógica de extracción ---
    const dolarValue = $('#dolar strong').text().trim().replace(/\./g, '').replace(',', '.');
    const dateValue = $('.pull-right.dinpro.center span.date-display-single').attr('content');

    return {
      valor: parseFloat(dolarValue),
      fecha: dateValue,
    };

  } catch (error) {
    const err = error as any;
    console.error("Error detallado:", err.code);
    throw new Error(`Error conectando al BCV: ${err.message}`);
  }
}
