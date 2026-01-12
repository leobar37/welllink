import { scryptSync, randomBytes } from "node:crypto";

// Better Auth scrypt parameters
const SCRYPT_N = 16384;
const SCRYPT_R = 16;
const SCRYPT_P = 1;
const KEYLEN = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password.normalize("NFKC"), salt, KEYLEN);

  // Format: scrypt:salt:hash
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

// Generate hash for test password
const password = "test123456";
const hash = hashPassword(password);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
