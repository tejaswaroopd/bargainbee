"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    console.error('[Error]', err);
    if (err.name === 'AppError') {
        const appErr = err;
        res.status(appErr.statusCode).json({ error: appErr.message });
        return;
    }
    if (err.name === 'ValidationError') {
        res.status(422).json({ error: err.message });
        return;
    }
    if (err.name === 'PrismaClientKnownRequestError') {
        res.status(409).json({ error: 'Database constraint or record conflict' });
        return;
    }
    res.status(500).json({ error: 'Internal server error' });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map