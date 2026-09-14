"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const uuid_1 = require("uuid");
const uploadFile = async (buffer, originalName, folder = 'vouchers') => {
    const ext = originalName.split('.').pop() || 'png';
    const filename = `${folder}/${(0, uuid_1.v4)()}.${ext}`;
    console.log(`[Storage] Mock uploaded: ${filename} (${buffer.length} bytes)`);
    // Returns placeholder or data URL / CDN mock URL
    return `https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80`;
};
exports.uploadFile = uploadFile;
//# sourceMappingURL=storageService.js.map