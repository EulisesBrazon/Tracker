
import { loginUser } from '../services';

export const loginController = {
	async post(params: { username: string; password: string }) {
		const { username, password } = params;
		if (!username || !password) {
			throw new Error('Usuario y contraseña son requeridos');
		}
		const result = await loginUser(username, password);
		return result;
	},
};
