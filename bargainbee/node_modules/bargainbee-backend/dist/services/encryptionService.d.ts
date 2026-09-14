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
/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-delimited string: "iv:authTag:ciphertext" (all hex-encoded).
 *
 * @param plaintext - The raw sensitive value (e.g. voucher code)
 * @returns Encrypted string safe to store in the database
 */
export declare function encryptField(plaintext: string): string;
/**
 * Decrypts a value previously encrypted by `encryptField`.
 * Returns the original plaintext string.
 *
 * Throws if the ciphertext has been tampered with (GCM auth tag mismatch).
 *
 * @param stored - The "iv:authTag:ciphertext" hex string from the database
 * @returns Original plaintext
 */
export declare function decryptField(stored: string): string;
/**
 * Returns true if the given string looks like an encrypted value
 * (i.e. it was already encrypted by encryptField and stored in the DB).
 * Used to safely handle existing plaintext records during migration.
 */
export declare function isEncrypted(value: string): boolean;
