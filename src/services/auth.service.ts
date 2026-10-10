import crypto from 'crypto';
import { IUserRepository } from '../repositories/user.repository.interface';
import { H2UserRepository } from '../repositories/h2-user.repository';
import { ISessionService, RedisSessionService } from './session.service';
import { hashPassword, verifyPassword } from '../security/hash';
import { signAccessToken } from '../security/jwt';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/app-error';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../schemas/auth.schema';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface AuthResult {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: string;
}

export class AuthService {
  private userRepo: IUserRepository;
  private sessionService: ISessionService;

  constructor(userRepo?: IUserRepository, sessionService?: ISessionService) {
    this.userRepo = userRepo || new H2UserRepository();
    this.sessionService = sessionService || new RedisSessionService();
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('E-mail já cadastrado');
    }

    const passwordHash = await hashPassword(input.password);
    const userId = crypto.randomUUID();

    const user = await this.userRepo.create({
      id: userId,
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const { sessionId, refreshToken } = await this.sessionService.createSession(user.id, user.email);

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      sessionId,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: '15m',
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      // Rejeita credenciais sem revelar existência do e-mail
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const { sessionId, refreshToken } = await this.sessionService.createSession(user.id, user.email);

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      sessionId,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: '15m',
    };
  }

  async refresh(input: RefreshTokenInput): Promise<RefreshResult> {
    const { newRefreshToken, session } = await this.sessionService.rotateRefreshToken(
      input.sessionId,
      input.refreshToken
    );

    const accessToken = signAccessToken({
      userId: session.userId,
      email: session.email,
      sessionId: session.sessionId,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: session.sessionId,
      expiresIn: '15m',
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.revokeSession(sessionId);
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    };
  }
}
