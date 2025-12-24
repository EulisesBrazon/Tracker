import mongoose from 'mongoose';

const uri = process.env.DATABASE_URL;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const globalCache = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cached = globalCache.mongooseCache ?? (globalCache.mongooseCache = { conn: null, promise: null });

export async function connectToDatabase() {
  console.log('[MongoDB] DATABASE_URL:', uri);
  if (cached.conn) return cached.conn;
  if (!uri) throw new Error('DATABASE_URL no está configurada en el entorno');

  if (!cached.promise) {
    console.log('[MongoDB] Estableciendo nueva conexión con Mongoose');
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  console.log('[MongoDB] Conexión exitosa a la base de datos');
  return cached.conn;
}

export async function getDb() {
  const connection = await connectToDatabase();
  return connection.connection.db;
}
