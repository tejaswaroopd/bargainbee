"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const storageService_1 = require("../services/storageService");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// POST /api/bulk/upload - Corporate bulk voucher ingestion
router.post('/upload', upload_1.upload.single('file'), async (req, res) => {
    const { companyName } = req.body;
    if (!companyName)
        throw new errorHandler_1.AppError('Company name is required', 400);
    if (!req.file)
        throw new errorHandler_1.AppError('CSV / Excel file is required', 400);
    const fileUrl = await (0, storageService_1.uploadFile)(req.file.buffer, req.file.originalname, 'bulk-uploads');
    const bulkUpload = await prisma_1.default.bulkUpload.create({
        data: {
            companyName,
            uploadedById: req.user.id,
            fileUrl,
            status: 'PROCESSING',
            totalCount: 15,
            processedCount: 0,
        },
    });
    // Simulate async background voucher creation for corporate seller
    setTimeout(async () => {
        try {
            await prisma_1.default.bulkUpload.update({
                where: { id: bulkUpload.id },
                data: { status: 'COMPLETED', processedCount: 15 },
            });
        }
        catch {
            // Ignore background simulation errors
        }
    }, 3000);
    res.status(201).json({
        bulkUpload,
        message: 'File uploaded successfully. Processing vouchers in background queue.',
    });
});
// GET /api/bulk/my
router.get('/my', async (req, res) => {
    const uploads = await prisma_1.default.bulkUpload.findMany({
        where: { uploadedById: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ uploads });
});
exports.default = router;
//# sourceMappingURL=bulk.js.map