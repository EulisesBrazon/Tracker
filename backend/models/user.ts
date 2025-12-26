
import mongoose, { Schema, model, Document } from 'mongoose';
import { User } from '../types';

interface UserDocMongoose extends User, Document {}

const UserSchema = new Schema<UserDocMongoose>({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	// email is optional — use a sparse unique index so multiple docs without email are allowed
	email: { type: String, required: false, unique: true, sparse: true, index: true },
	// role: defaults to 'user'
	role: { type: String, required: true, default: 'user', enum: ['user', 'admin'] },
});

const UserModel = (mongoose.models && (mongoose.models as any).User) || model<UserDocMongoose>('User', UserSchema);

export default UserModel;
