import crypto from 'crypto';
import { env } from '../config/env';
import { runMigrations } from './migrate';
import { H2UserRepository } from '../repositories/h2-user.repository';
import { hashPassword } from '../security/hash';
import { closeDatabase } from './connection';

export const SEED_USERS = [
  {
    name: 'Usuário de Teste',
    email: 'user@example.com',
    password: 'Password123!',
  },
  {
    name: 'Administrador de Teste',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  },
];

export async function runSeed(): Promise<void> {
  console.log('🌱 Iniciando execução do seed de dados...');

  // Proteção contra execução acidental em produção
  if (env.NODE_ENV === 'production') {
    console.error('⛔ ERRO DE SEGURANÇA: O seed não pode ser executado em ambiente de produção!');
    process.exit(1);
  }

  // Garante que o esquema e tabelas estejam criados
  await runMigrations();

  const userRepo = new H2UserRepository();
  let createdCount = 0;
  let skippedCount = 0;

  for (const user of SEED_USERS) {
    const existing = await userRepo.findByEmail(user.email);
    if (existing) {
      console.log(`ℹ️ Usuário já existente: ${user.email} (pulando inserção)`);
      skippedCount++;
    } else {
      const passwordHash = await hashPassword(user.password);
      await userRepo.create({
        id: crypto.randomUUID(),
        name: user.name,
        email: user.email,
        passwordHash,
      });
      console.log(`✅ Usuário criado com sucesso: ${user.email} / senha: ${user.password}`);
      createdCount++;
    }
  }

  console.log(`\n🎉 Seed concluído! Criados: ${createdCount}, Ignorados (já existentes): ${skippedCount}`);
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      await closeDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Falha ao executar o seed:', err);
      await closeDatabase();
      process.exit(1);
    });
}
