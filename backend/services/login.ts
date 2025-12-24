
import UserModel from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '30d'; // 1 mes

export async function loginUser(username: string, password: string) {
	// buscar por username o por email para soportar login por email
	const user = await UserModel.findOne({ $or: [{ username }, { email: username }] });
	if (!user) {
		throw new Error('Usuario no encontrado');
	}
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error('Contraseña incorrecta');
	}
	// Generar JWT
	const token = jwt.sign(
		{
			id: user._id,
			username: user.username,
			email: user.email,
		},
		JWT_SECRET,
		{ expiresIn: JWT_EXPIRES_IN }
	);
	return { token, user: { username: user.username, email: user.email } };
}
