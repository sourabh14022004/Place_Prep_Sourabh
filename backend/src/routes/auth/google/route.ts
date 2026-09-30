/**
 * backend/src/routes/auth/google/route.ts
 * POST /api/auth/google — Google OAuth authentication endpoint.
 *
 * STRICTLY RESTRICTED: Only accepts Google accounts ending with @nst.rishihood.edu.in.
 * Validates Google ID token via Google's tokeninfo service, checks verified email status,
 * matches client ID audience if configured, auto-provisions student accounts for NST students,
 * issues the PlacePrep session cookie, and returns the appropriate portal redirect.
 */

import connectDB from '../../../config/db';
import { authService } from '../../../services/auth.service';
import { googleAuthSchema } from '../../../validators/auth.validator';
import { successResponse, withCookie } from '../../../utils/apiResponse';
import { ApiError, handleApiError } from '../../../utils/apiError';
import { TOKEN_COOKIE_NAME } from '../../../utils/authMiddleware';
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from '../../../utils/rateLimiter';
import { logger } from '../../../utils/logger';

interface GoogleTokenInfo {
  iss?: string;
  sub?: string;
  aud?: string;
  azp?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  hd?: string;
  error?: string;
  error_description?: string;
}

const NST_DOMAIN = '@nst.rishihood.edu.in';

export async function POST(request: Request): Promise<Response> {
  // Payload size guard — reject bodies over 10 KB
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10240) {
    return Response.json(
      { success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large.' } },
      { status: 413 }
    );
  }

  try {
    await connectDB();

    const ip = getClientIp(request);
    const ipKey = `google_auth:ip:${ip}`;
    const rl = checkRateLimit(ipKey, RATE_LIMITS.LOGIN_IP);
    if (!rl.allowed) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many attempts from this network. Please wait a few moments.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = googleAuthSchema.safeParse(body);

    if (!validation.success) {
      throw ApiError.badRequest('Invalid input payload.', validation.error.flatten().fieldErrors);
    }

    const { credential, devMode, email: directEmail, name: directName, picture: directPicture, googleId: directGoogleId } = validation.data;

    let email = '';
    let name: string | undefined;
    let picture: string | undefined;
    let googleId: string | undefined;

    if (credential) {
      // 1. Verify with Google's public tokeninfo endpoint
      let tokenInfo: GoogleTokenInfo;
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
          { headers: { Accept: 'application/json' } }
        );
        tokenInfo = (await verifyRes.json()) as GoogleTokenInfo;

        if (!verifyRes.ok || tokenInfo.error || !tokenInfo.email) {
          logger.warn({ error: tokenInfo.error || tokenInfo.error_description }, 'Google token verification rejected by Google API');
          throw ApiError.unauthorized('Invalid or expired Google authentication token.');
        }
      } catch (err: unknown) {
        if (err instanceof ApiError) throw err;
        logger.error({ err }, 'Network failure verifying Google ID token');
        throw ApiError.internal('Unable to verify Google credential at this time. Please try again.');
      }

      // Check audience if GOOGLE_CLIENT_ID is set
      const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (configuredClientId && tokenInfo.aud && tokenInfo.aud !== configuredClientId) {
        logger.warn({ tokenAud: tokenInfo.aud, configuredClientId }, 'Google Client ID audience mismatch');
        throw ApiError.unauthorized('Google token audience does not match configured Client ID.');
      }

      // Check email verified status
      const isVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
      if (!isVerified) {
        throw ApiError.unauthorized('Your Google email address is not verified by Google.');
      }

      email = tokenInfo.email.toLowerCase().trim();
      name = tokenInfo.name;
      picture = tokenInfo.picture;
      googleId = tokenInfo.sub;
    } else if (process.env.NODE_ENV !== 'production' && devMode && directEmail) {
      // Development mode helper (allows testing before Google Cloud credentials are bound)
      email = directEmail.toLowerCase().trim();
      name = directName || email.split('@')[0];
      picture = directPicture;
      googleId = directGoogleId || `dev_${Buffer.from(email).toString('hex').slice(0, 16)}`;
      logger.info({ email }, 'Dev-mode Google auth bypass processed');
    } else {
      throw ApiError.badRequest('Missing Google credential. Please sign in through Google.');
    }

    // ── STRICT DOMAIN GATING ──────────────────────────────────────────
    // Only Newton School of Technology (@nst.rishihood.edu.in) accounts are allowed.
    if (!email.endsWith(NST_DOMAIN)) {
      logger.warn({ email, attemptedDomain: email.split('@')[1] }, 'Google login rejected: Domain is not @nst.rishihood.edu.in');
      return Response.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN_DOMAIN',
            message: `Access restricted: Only Newton School of Technology (${NST_DOMAIN}) accounts are permitted to sign in.`,
          },
        },
        { status: 403 }
      );
    }

    const result = await authService.loginWithGoogle({
      email,
      name,
      picture,
      googleId,
    });

    const response = successResponse(
      {
        role: result.role,
        userId: result.userId,
        name: result.name,
        redirectUrl: result.redirectUrl,
        isNewUser: result.isNewUser,
      },
      { message: result.isNewUser ? 'Welcome to PlacePrep! Account created.' : 'Login successful' }
    );

    // Set HTTP-only cookie — 7 days
    return withCookie(response, `${TOKEN_COOKIE_NAME}_${result.role}`, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
