import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome não pode exceder 100 caracteres'),
  email: z
    .string()
    .trim()
    .email('E-mail informado é inválido')
    .max(255, 'E-mail não pode exceder 255 caracteres'),
  password: z
    .string()
    .min(8, 'A senha deve conter no mínimo 8 caracteres')
    .max(128, 'A senha não pode exceder 128 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('E-mail informado é inválido'),
  password: z
    .string()
    .min(1, 'A senha é obrigatória'),
});

export const RefreshTokenSchema = z.object({
  sessionId: z.string().uuid('ID de sessão inválido'),
  refreshToken: z.string().min(10, 'Refresh token inválido'),
});

export const LogoutSchema = z
  .object({
    sessionId: z.string().uuid('ID de sessão inválido').optional(),
    refreshToken: z.string().optional(),
  })
  .optional()
  .default({});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
