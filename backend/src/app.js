const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const postRoutes = require('./modules/posts/post.routes');
const professorRoutes = require('./modules/professores/professor.routes');
const alunoRoutes = require('./modules/alunos/aluno.routes');
const authRoutes = require('./modules/auth/auth.routes');
const { getConfig } = require('./config/env');
const { createCorsOptions } = require('./config/cors');
const { createLoginRateLimiters } = require('./middlewares/loginRateLimit');

function createApp() {
  const config = getConfig();
  const app = express();

  app.use(helmet());
  app.use(cors(createCorsOptions(config)));
  app.use(express.json());

  // Limites complementares mitigam ataques por IP e distribuídos por identidade.
  // O email normalizado vira somente uma chave HMAC; não é armazenado nem logado em claro.
  const { ipLimiter: loginIpLimiter, identityLimiter: loginIdentityLimiter } =
    createLoginRateLimiters({ secret: config.rateLimitSecret });

  app.use('/posts', postRoutes);
  app.use('/professores', professorRoutes);
  app.use('/alunos', alunoRoutes);
  app.use('/auth/login', loginIpLimiter, loginIdentityLimiter);
  app.use('/auth', authRoutes);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
