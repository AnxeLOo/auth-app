import { IUserRepository, User, CreateUserData } from './user.repository.interface';
import { query } from '../database/connection';

export class H2UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await query<User>(
      'SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await query<User>(
      'SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async create(userData: CreateUserData): Promise<User> {
    const normalizedEmail = userData.email.trim().toLowerCase();
    await query(
      `INSERT INTO users (id, name, email, password_hash, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userData.id, userData.name.trim(), normalizedEmail, userData.passwordHash]
    );

    const created = await this.findById(userData.id);
    if (!created) {
      throw new Error('Falha ao recuperar o usuário criado no H2 Database');
    }
    return created;
  }
}
