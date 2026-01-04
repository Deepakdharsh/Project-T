import bcrypt from 'bcrypt';
import { ApiError } from '../utils/apiError.js';
import { UserModel } from '../models/User.js';
import { signAccessToken } from '../utils/jwt.js';

export async function registerUser(input: { email: string; name: string; password: string }) {
  const existing = await UserModel.findOne({ email: input.email }).lean();
  if (existing) throw new ApiError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({
    email: input.email,
    name: input.name,
    passwordHash,
    role: 'user',
  });

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  return {
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
    accessToken,
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await UserModel.findOne({ email: input.email });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  return {
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
    accessToken,
  };
}


