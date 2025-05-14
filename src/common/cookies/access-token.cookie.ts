import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';

export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 15, // 15 min
  path: '/',
};
