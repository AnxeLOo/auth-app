import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

/**
 * Gera um hash seguro da senha utilizando Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, {
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Compara uma senha em texto puro com o hash Argon2id em tempo constante.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argonVerify(hash, password);
  } catch (err) {
    return false;
  }
}
