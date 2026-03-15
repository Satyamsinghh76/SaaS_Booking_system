/**
 * tokenEncryption.js
 * ─────────────────────────────────────────────────────────────
 * AES-256-GCM symmetric encryption for OAuth refresh tokens.
 *
 * Why encrypt in the database?
 * If the database is ever compromised, the attacker gets
 * ciphertext — they cannot use it without TOKEN_ENCRYPTION_KEY,
 * which lives only in the server environment.
 *
 * Format stored in DB:  <iv_hex>:<authTag_hex>:<ciphertext_hex>
 * All three parts are required for decryption.
 */

'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits

/** Get the 32-byte key from environment, validated at startup. */
const getKey = () => {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex, 'hex');
};

/**
 * Encrypt a plaintext string (e.g. a refresh token).
 * @param {string} plaintext
 * @returns {string}  "<iv>:<authTag>:<ciphertext>" (all hex)
 */
const encrypt = (plaintext) => {
  const key    = getKey();
  const iv     = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
};

/**
 * Decrypt a string produced by encrypt().
 * @param {string} stored  "<iv>:<authTag>:<ciphertext>"
 * @returns {string}       original plaintext
 */
const decrypt = (stored) => {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(':');
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted token format.');
  }

  const key      = getKey();
  const iv       = Buffer.from(ivHex,       'hex');
  const authTag  = Buffer.from(authTagHex,  'hex');
  const cipher   = Buffer.from(ciphertextHex,'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(cipher), decipher.final()]).toString('utf8');
};

module.exports = { encrypt, decrypt };
