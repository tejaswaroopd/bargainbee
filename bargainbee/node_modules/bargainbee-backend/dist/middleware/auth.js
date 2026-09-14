"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSeller = exports.requireAdmin = exports.authenticate = void 0;
const jwt_1 = require("../config/jwt");
const prisma_1 = __importDefault(require("../config/prisma"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authentication required. No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            // FEATURE 6: include isVerified so downstream middleware can check it
            select: { id: true, email: true, role: true, name: true, isVerified: true },
        });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireSeller = (req, res, next) => {
    if (!['SELLER', 'BOTH', 'ADMIN'].includes(req.user?.role || '')) {
        res.status(403).json({ error: 'Seller privileges required' });
        return;
    }
    next();
};
exports.requireSeller = requireSeller;
//# sourceMappingURL=auth.js.map