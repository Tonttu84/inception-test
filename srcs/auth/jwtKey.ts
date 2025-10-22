// src/auth/jwtKey.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const keyPath = path.join(__dirname, '../../data/jwt.key');

export function getOrCreateJwtKey(): string {
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf8');
  }

  // Generate a random private key for backend
  const newKey = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(keyPath, newKey, { mode: 0o600 }); // restrict permissions
  return newKey;
}
