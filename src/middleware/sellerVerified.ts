/**
 * FEATURE 6 — Seller Verification
 *
 * Guards listing creation/editing routes so that only sellers whose email
 * has been verified (isVerified === true) can post listings.
 *
 * This prevents anonymous or unconfirmed accounts from flooding the
 * marketplace with unverifiable listings.
 *
 * Applied as middleware on POST /api/listings and PUT /api/listings/:id.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireSellerVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // FEATURE 6: Block unverified sellers from creating/editing listings
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      error: 'Seller verification required. Please verify your email address before listing a voucher.',
      action: 'VERIFY_EMAIL', // Frontend can use this to show the right prompt
    });
    return;
  }

  next();
};
