require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

// Sem tratamento de sinal, um restart do container abortava requisições em voo
// (inclusive depois de um UPDATE já aplicado) e nunca fechava o pool do Prisma.
function shutdown(signal) {
  console.log(`[server] ${signal} recebido, encerrando conexoes`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  });

  // Rede de segurança: se alguma conexão travar, não fica pendurado para sempre.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
