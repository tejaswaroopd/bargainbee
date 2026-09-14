/**
 * Auth Routes
 *
 * FEATURE 1 — Secure User Authentication:
 *   - loginRateLimiter applied to POST /login (5 attempts / 15 min)
 *   - bcrypt hash (cost 12) on register; never store plaintext
 *   - JWT startup guard: refuses dev-default secret in production
 *
 * FEATURE 6 — Seller Verification:
 *   - POST /register sends a 6-digit OTP email and stores a VerificationToken
 *   - POST /verify-email validates OTP, sets isVerified=true, logs audit
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import prisma from '../config/prisma';
import { signToken } from '../config/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/loginRateLimiter';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../services/emailService';
import { logAudit } from '../services/auditService';

// FEATURE 1 — Guard: refuse the hardcoded dev secret in production
if (process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret_change_in_prod')) {
  throw new Error('[Security] JWT_SECRET must be set to a strong random value in production. ' +
    'Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body;

  if (!email || !name || !password) {
    throw new AppError('Email, name, and password are required', 400);
  }

  // FEATURE 1 — Password policy: minimum 8 chars, at least one uppercase and one digit
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new AppError('Password must contain at least one uppercase letter and one digit', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists', 409);

  // FEATURE 1 — Hash with bcrypt cost factor 12 (higher than original 10 for stronger resistance)
  const passwordHash = await bcrypt.hash(password, 12);
  const referralCode = createHash('sha256')
    .update(email + Date.now())
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: role || 'BUYER',
      isVerified: false, // FEATURE 6: requires email verification before listing
      referralCode,
    },
    select: { id: true, email: true, name: true, role: true, avatar: true, repScore: true, isVerified: true },
  });

  // FEATURE 6 — Send email verification OTP (6-digit, expires in 30 minutes)
  const otp = String(randomInt(100000, 999999));
  const otpHash = createHash('sha256').update(otp).digest('hex');
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token: otpHash,
      type: 'EMAIL_VERIFY',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    },
  });

  // Send OTP email (simulation-safe: falls back to console.log if SMTP not configured)
  await sendEmail({
    to: email,
    subject: '🐝 BargainBee — Verify your email address',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1A1A1A;">Welcome to BargainBee, ${name}!</h2>
        <p>Use the code below to verify your email. It expires in 30 minutes.</p>
        <div style="background:#FFF9D2;border:2px dashed #F5C518;padding:20px;
                    font-size:32px;font-weight:bold;letter-spacing:8px;
                    text-align:center;border-radius:8px;margin:20px 0;color:#1A1A1A;">
          ${otp}
        </div>
        <p style="color:#6B7280;font-size:0.85rem;">
          If you did not create a BargainBee account, ignore this email.
        </p>
      </div>
    `,
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json({
    user,
    token,
    message: 'Account created. Please check your email for a verification code.',
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login  (FEATURE 1: strict rate-limiter applied)
// ---------------------------------------------------------------------------
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password required', 400);

  const user = await prisma.user.findUnique({ where: { email } });

  // FEATURE 1 — Constant-time comparison path: always run bcrypt even on missing user
  // to prevent user-enumeration timing attacks
  const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000';
  const hashToCompare = user?.passwordHash ?? dummyHash;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !user.passwordHash || !valid) {
    // FEATURE 7 — Log failed login attempt for security audit
    if (user) {
      await logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED',
        ipAddress: req.ip,
        metadata: { email },
      });
    }
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify-email  (FEATURE 6 — Seller Verification)
// ---------------------------------------------------------------------------
router.post('/verify-email', authenticate, async (req: AuthRequest, res: Response) => {
  const { otp } = req.body;
  if (!otp) throw new AppError('Verification code is required', 400);

  const otpHash = createHash('sha256').update(String(otp)).digest('hex');

  // Find a valid, unused token for this user
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      userId: req.user!.id,
      token: otpHash,
      type: 'EMAIL_VERIFY',
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new AppError('Invalid or expired verification code', 400);
  }

  // Mark token used and verify the user in one transaction
  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: req.user!.id },
      data: {
        isVerified: true,
        sellerVerifiedAt: new Date(),
      },
    }),
  ]);

  // FEATURE 7 — Audit log: email verified
  await logAudit({
    userId: req.user!.id,
    action: 'EMAIL_VERIFIED',
    ipAddress: req.ip,
    metadata: { email: req.user!.email },
  });

  res.json({ message: 'Email verified successfully. You can now list vouchers.' });
});

// ---------------------------------------------------------------------------
// POST /api/auth/resend-verification  (FEATURE 6 — resend OTP)
// ---------------------------------------------------------------------------
router.post('/resend-verification', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('Email is already verified', 400);

  // Invalidate all previous unused tokens
  await prisma.verificationToken.updateMany({
    where: { userId: user.id, type: 'EMAIL_VERIFY', used: false },
    data: { used: true },
  });

  const otp = String(randomInt(100000, 999999));
  const otpHash = createHash('sha256').update(otp).digest('hex');
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token: otpHash,
      type: 'EMAIL_VERIFY',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  await sendEmail({
    to: user.email,
    subject: '🐝 BargainBee — New verification code',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1A1A1A;">New verification code, ${user.name}</h2>
        <div style="background:#FFF9D2;border:2px dashed #F5C518;padding:20px;
                    font-size:32px;font-weight:bold;letter-spacing:8px;
                    text-align:center;border-radius:8px;margin:20px 0;color:#1A1A1A;">
          ${otp}
        </div>
        <p style="color:#6B7280;font-size:0.85rem;">Expires in 30 minutes.</p>
      </div>
    `,
  });

  res.json({ message: 'New verification code sent to your email address.' });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, name: true, role: true, avatar: true,
      repScore: true, totalSales: true, totalPurchases: true,
      referralCode: true, isVerified: true, createdAt: true,
      flaggedForReview: true, // FEATURE 4: visible to admin/own dashboard
    },
  });
  res.json({ user });
});

// ---------------------------------------------------------------------------
// PUT /api/auth/me
// ---------------------------------------------------------------------------
router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, avatar, role } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, avatar, ...(role && { role }) },
    select: { id: true, email: true, name: true, role: true, avatar: true, repScore: true, isVerified: true },
  });
  res.json({ user });
});

export default router;
