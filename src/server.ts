import { app } from './app';
import { env } from './config/env';
import { runMigrations } from './database/migrate';
import { connectRedis, closeRedis } from './lib/redis';
import { closeDatabase } from './database/connection';

async function bootstrap() {
  console.log('🚀 Iniciando API Backend de Autenticação...');
  console.log(`Ambiente: ${env.NODE_ENV}`);

  // Conecta ao Redis
  await connectRedis();

  // Executa migrações no H2 Database
  try {
    console.log('📦 Verificando migrações do banco de dados H2...');
    await runMigrations();
    console.log('✅ Migrações aplicadas com sucesso.');
  } catch (error: any) {
    console.error('❌ Falha ao inicializar o banco de dados H2:', error.message);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Inicializa o servidor HTTP
  const server = app.listen(env.PORT, () => {
    console.log(`🌐 Servidor ouvindo na porta ${env.PORT} (http://localhost:${env.PORT})`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Recebido sinal ${signal}. Encerrando aplicação com segurança...`);
    server.close(async () => {
      console.log('Servidor HTTP encerrado.');
      try {
        await closeRedis();
        console.log('Conexão Redis encerrada.');
        await closeDatabase();
        console.log('Pool H2 Database encerrado.');
      } catch (err) {
        console.error('Erro durante encerramento dos recursos:', err);
      } finally {
        process.exit(0);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('💥 Erro fatal ao iniciar o servidor:', err);
  process.exit(1);
});
