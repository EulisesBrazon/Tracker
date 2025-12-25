import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'supersecretkey';

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function signToken(payload: object, expiresIn: string | number = '30d') {
  const opts: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload as string | object | Buffer, JWT_SECRET, opts);
}

export default { verifyToken, signToken };
