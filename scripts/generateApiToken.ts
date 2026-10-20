import { randomBytes } from 'node:crypto';

/**
 * Genera un token para la API pública de tasas.
 *
 * Uso:  npm run generate-api-token
 *
 * Copia el valor en `API_TOKEN` (este proyecto) y en `TRAKER_API_TOKEN`
 * del consumidor. Deben coincidir exactamente.
 */
const token = randomBytes(32).toString('base64url');

console.log('');
console.log('Token generado (32 bytes):');
console.log('');
console.log(`  ${token}`);
console.log('');
console.log('  traker          → API_TOKEN');
console.log('  inventarioPollo → TRAKER_API_TOKEN');
console.log('');
console.log('Recuerda añadirlo también a las variables de entorno de Vercel.');
console.log('');
