import { env } from "@/env";
import crypto from "crypto";

// Generate signing secret key
export function generateSigningKey() {
  const signingSecret = "whsec_" + crypto.randomBytes(30).toString("hex");
  return signingSecret;
}

// Generate API key
export function generateApiKey() {
  const apiKey = "hs_" + crypto.randomBytes(15).toString("hex").slice(0, 15);
  return apiKey;
}

// Encrypt data using AES-256-GCM
export function encryptData(plaintext: string): string {
  const encryptionKey = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

// Decrypt data using AES-256-GCM
export function decryptData(encryptedData: string): string {
  const encryptionKey = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, encrypted] = parts;

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
