import { CookieOptions } from 'express';

export const SESSION_ID_COOKIE_NAME = 'session_id';

export const SESSION_ID_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};
