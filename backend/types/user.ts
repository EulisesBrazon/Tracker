export type User = {
	username: string;
	password: string;
	email?: string;
};

// Si necesitas un tipo para crear usuario sin password (por ejemplo, para registro)
export type UserCreate = Omit<User, 'password'> & { password: string };

// Si necesitas un tipo para respuesta sin password
export type UserResponse = Omit<User, 'password'>;
