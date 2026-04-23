/**
 * Encryption Utility for sensitive medical data
 * Uses AES-256-GCM for authenticated encryption
 * 
 * CRITICAL: Encryption key must be 32 bytes (256 bits)
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const TAG_LENGTH = 16; // GCM authentication tag length in bytes

/**
 * Get encryption key from environment variable
 * Must be 64-character hex string (32 bytes)
 */
function getEncryptionKey() {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'DATA_ENCRYPTION_KEY not set in environment. Generate with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  
  if (key.length !== 64) {
    throw new Error('DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @returns {Object} - { encrypted: hex, iv: hex, authTag: hex }
 */
function encrypt(plaintext) {
  if (typeof plaintext !== 'string') {
    throw new Error('Data must be a string');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: ALGORITHM
    };
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {Object} encryptedObj - { encrypted: hex, iv: hex, authTag: hex }
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedObj) {
  if (!encryptedObj || !encryptedObj.encrypted || !encryptedObj.iv || !encryptedObj.authTag) {
    throw new Error('Invalid encrypted object structure');
  }

  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encryptedObj.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedObj.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('Failed to decrypt data - may be corrupted or using wrong key');
  }
}

/**
 * Encrypt an object's sensitive fields
 * @param {Object} data - Data object
 * @param {Array<string>} fieldsToEncrypt - List of field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
function encryptFields(data, fieldsToEncrypt) {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object');
  }

  const encrypted = { ...data };
  
  fieldsToEncrypt.forEach(field => {
    if (field in encrypted && encrypted[field] !== null && encrypted[field] !== undefined) {
      encrypted[field] = encrypt(String(encrypted[field]));
    }
  });
  
  return encrypted;
}

/**
 * Decrypt an object's sensitive fields
 * @param {Object} data - Encrypted data object
 * @param {Array<string>} fieldsToDecrypt - List of field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
function decryptFields(data, fieldsToDecrypt) {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object');
  }

  const decrypted = { ...data };
  
  fieldsToDecrypt.forEach(field => {
    if (field in decrypted && decrypted[field] && decrypted[field].encrypted) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });
  
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  getEncryptionKey
};
