import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../../src/security/jwt';
import { UnauthorizedError } from '../../src/errors/app-error';

describe('Security: JWT Access Token', () => {
  it('deve assinar e decodificar token JWT válido com sucesso', () => {
    const payload = {
      userId: 'user-123',
      email: 'user@example.com',
      sessionId: 'session-456',
    };

    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.sessionId).toBe(payload.sessionId);
  });

  it('deve rejeitar token malformado ou alterado', () => {
    expect(() => {
      verifyAccessToken('invalid.token.structure');
    }).toThrow(UnauthorizedError);
  });
});
