import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface JwtPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const signToken = (id: string | Types.ObjectId, role: string): string => {
  const payload = { id: id.toString(), role };
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
};

export const createSendToken = async (
  user: any,
  statusCode: number,
  res: any
) => {
  // Create access token (short-lived)
  const accessToken = signToken(user._id, user.role);

  // Create refresh token (long-lived - stored in database)
  const refreshToken = user.createRefreshToken();
  await user.save({ validateBeforeSave: false });

  // Access token cookie options (7 days or configured)
  const accessCookieOptions = {
    expires: new Date(
      Date.now() + (Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const
  };

  // Refresh token cookie options (30 days)
  const refreshCookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/v1/auth/refresh' // Only sent to refresh endpoint
  };

  // Set cookies
  res.cookie('jwt', accessToken, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  // Remove sensitive fields from output
  user.password = undefined;
  user.refreshToken = undefined;
  user.refreshTokenExpires = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: accessToken,
    refreshToken, // Also send in body for clients not using cookies
    data: {
      user
    }
  });
};