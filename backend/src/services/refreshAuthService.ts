import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { UserModel } from '../models/User.js';
import { RefreshTokenModel } from '../models/RefreshToken.js';
import { hashToken, signRefreshToken, verifyRefreshToken } from '../utils/refreshToken.js';
import { signAccessToken } from '../utils/jwt.js';

function parseExpiresAt(token: string): Date {
  const decoded = jwt.decode(token) as any;
  const expSec = decoded?.exp;
  if (!expSec) throw new ApiError(500, 'Refresh token missing exp');
  return new Date(expSec * 1000);
}

export async function issueRefreshSession(userId: string) {
  const refreshToken = signRefreshToken(userId);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = parseExpiresAt(refreshToken);
  await RefreshTokenModel.create({ userId, tokenHash, expiresAt });
  return refreshToken;
}

export async function rotateRefreshSession(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken) as any;
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) throw new ApiError(401, 'Refresh token expired');
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const tokenDoc = await RefreshTokenModel.findOne({ tokenHash });
  if (!tokenDoc) throw new ApiError(401, 'Refresh token not recognized');
  if (tokenDoc.revokedAt) throw new ApiError(401, 'Refresh token revoked');
  if (tokenDoc.expiresAt.getTime() <= Date.now()) throw new ApiError(401, 'Refresh token expired');

  const user = await UserModel.findById(payload.sub).lean();
  if (!user) throw new ApiError(401, 'User not found');

  const newRefresh = await issueRefreshSession(user._id.toString());
  const newHash = hashToken(newRefresh);

  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByTokenHash = newHash;
  await tokenDoc.save();

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  return {
    user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken: newRefresh,
  };
}

export async function revokeRefreshSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await RefreshTokenModel.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}


