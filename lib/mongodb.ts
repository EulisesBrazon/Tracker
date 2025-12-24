import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

const uri = process.env.DATABASE_URL;

export async function connectToDatabase() {
  if (db && client) return { client, db };
  if (!uri) throw new Error('DATABASE_URL no está configurada en el entorno');

  client = new MongoClient(uri);
  await client.connect();

  // Si la URI incluye el nombre de la BD, MongoClient lo tomará automáticamente.
  db = client.db();

  return { client, db };
}

export async function getDb() {
  const c = await connectToDatabase();
  return c.db;
}
