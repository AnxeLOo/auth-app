import fs from 'fs';
import path from 'path';
import { pool } from './connection';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Garante que a tabela de controle de migrações existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Busca migrações já executadas
    const res = await client.query('SELECT id FROM schema_migrations');
    const appliedMigrations = new Set<string>(res.rows.map((row) => row.id));

    // Diretório de migrações com suporte para src e dist compilado
    let migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      const fallbackDir = path.join(__dirname, '../../src/database/migrations');
      if (fs.existsSync(fallbackDir)) {
        migrationsDir = fallbackDir;
      }
    }

    if (!fs.existsSync(migrationsDir)) {
      console.log('Nenhum diretório de migrações encontrado. Continuando...');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (!appliedMigrations.has(file)) {
        console.log(`Aplicando migração: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Migração ${file} aplicada com sucesso!`);
        } catch (migrationError) {
          await client.query('ROLLBACK');
          console.error(`Erro ao executar migração ${file}:`, migrationError);
          throw migrationError;
        }
      }
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrações concluídas.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Falha na execução das migrações:', err);
      process.exit(1);
    });
}
