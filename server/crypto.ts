import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'neural-notify-encryption-key-32bytes!';
const ALGORITHM = 'aes-256-cbc';

export function encryptToken(token: string): string {
  if (!token) return '';
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) return '';
  
  try {
    const [ivHex, encrypted] = encryptedToken.split(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return '';
  }
}