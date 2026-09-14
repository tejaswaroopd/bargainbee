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
export declare const requireSellerVerified: (req: AuthRequest, res: Response, next: NextFunction) => void;
