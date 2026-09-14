"use strict";
/**
 * FEATURE 2 — Encrypted Transactions
 *
 * AES-256-GCM symmetric encryption for sensitive fields stored in the database.
 * Uses Node's built-in `crypto` module — no extra dependencies required.
 *
 * Storage format: "iv_hex:authTag_hex:ciphertext_hex"
 *  - iv         : 12 random bytes (96-bit nonce, optimal for GCM)
 *  - authTag    : 16 bytes GCM authentication tag (integrity + authenticity)
 *  - ciphertext : encrypted payload
 *
 * Key requirements:
 *   ENCRYPTION_KEY_HEX must be a 64-character hex string (32 bytes = 256-bit key).
 *   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptField = encryptField;
exports.decryptField = decryptField;
exports.isEncrypted = isEncrypted;
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce — recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
/**
 * Lazily resolves the encryption key from the environment.
 * Throws at call-time (not at import-time) to allow the app to start in dev without the key,
 * but will hard-fail if a real encrypt/decrypt is attempted without it.
 */
function getKey() {
    const hex = process.env.ENCRYPTION_KEY_HEX;
    if (!hex || hex.length !== 64) {
        throw new Error('[Security] ENCRYPTION_KEY_HEX must be a 64-character hex string (32 bytes). ' +
            'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
    return Buffer.from(hex, 'hex');
}
/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-delimited string: "iv:authTag:ciphertext" (all hex-encoded).
 *
 * @param plaintext - The raw sensitive value (e.g. voucher code)
 * @returns Encrypted string safe to store in the database
 */
function encryptField(plaintext) {
    const key = getKey();
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex'),
    ].join(':');
}
/**
 * Decrypts a value previously encrypted by `encryptField`.
 * Returns the original plaintext string.
 *
 * Throws if the ciphertext has been tampered with (GCM auth tag mismatch).
 *
 * @param stored - The "iv:authTag:ciphertext" hex string from the database
 * @returns Original plaintext
 */
function decryptField(stored) {
    const key = getKey();
    const parts = stored.split(':');
    if (parts.length !== 3) {
        throw new Error('[Security] Invalid encrypted field format. Expected "iv:authTag:ciphertext".');
    }
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
/**
 * Returns true if the given string looks like an encrypted value
 * (i.e. it was already encrypted by encryptField and stored in the DB).
 * Used to safely handle existing plaintext records during migration.
 */
function isEncrypted(value) {
    const parts = value.split(':');
    return (parts.length === 3 &&
        /^[0-9a-f]+$/i.test(parts[0]) &&
        parts[0].length === IV_LENGTH * 2 &&
        /^[0-9a-f]+$/i.test(parts[1]) &&
        parts[1].length === AUTH_TAG_LENGTH * 2 &&
        /^[0-9a-f]+$/i.test(parts[2]));
}
//# sourceMappingURL=encryptionService.js.map