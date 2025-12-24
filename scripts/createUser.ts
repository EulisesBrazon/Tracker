import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserModel from '../backend/models/user';
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/test';

async function createUser(username: string, password: string, email?: string) {
  await mongoose.connect(MONGODB_URI);
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new UserModel({ username, password: hashedPassword, email });
  await user.save();
  console.log('Usuario creado:', user);
  await mongoose.disconnect();
}


// Carga los datos del usuario desde variables de entorno

const username = process.env.USER_USERNAME || '';
const password = process.env.USER_PASSWORD || '';
const email = process.env.USER_EMAIL || '';

console.log('Datos recibidos:', { username, password, email });

createUser(username, password, email)
  .catch(err => {
    console.error('Error al crear usuario:', err);
    mongoose.disconnect();
  });
