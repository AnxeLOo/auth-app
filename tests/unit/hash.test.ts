import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/security/hash';

describe('Security: Argon2id Hash', () => {
  it('deve gerar hash de senha que não é texto plano', async () => {
    const rawPassword = 'SecretPassword123!';
    const hashed = await hashPassword(rawPassword);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(rawPassword);
    expect(hashed).toContain('$argon2id$');
  });

  it('deve verificar senha correta com sucesso', async () => {
    const rawPassword = 'SecretPassword123!';
    const hashed = await hashPassword(rawPassword);

    const isValid = await verifyPassword(rawPassword, hashed);
    expect(isValid).toBe(true);
  });

  it('deve rejeitar senha incorreta', async () => {
    const rawPassword = 'SecretPassword123!';
    const hashed = await hashPassword(rawPassword);

    const isValid = await verifyPassword('WrongPassword999!', hashed);
    expect(isValid).toBe(false);
  });
});
