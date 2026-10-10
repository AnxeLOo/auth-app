import { IUserRepository, User, CreateUserData } from './user.repository.interface';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(userData: CreateUserData): Promise<User> {
    const now = new Date();
    const user: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      password_hash: userData.passwordHash,
      created_at: now,
      updated_at: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  clear(): void {
    this.users.clear();
  }
}
