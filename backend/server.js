/**
 * ============================================
 * ShortLink Pro — Server Entry Point
 * ============================================
 */

const app = require('./src/app');
const config = require('./src/config/environment');
const { testConnection } = require('./src/config/database');

async function startServer() {
  console.log('\n🔗 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ShortLink Pro Backend — URL Shortener');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test Supabase connection before launching server
  console.log('📡 Connecting to Supabase...');
  await testConnection();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Base URL: ${config.baseUrl}`);
    console.log(`🔌 API Base: ${config.baseUrl}/api/urls`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });

  // Handle termination signals
  const shutdown = () => {
    console.log('\nStopping server safely...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
