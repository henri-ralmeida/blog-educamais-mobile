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
const { logControllerError } = require('./config/logger');

function createApp() {
  const config = getConfig();
  const app = express();

  // Sem isso, atrás do gateway do Docker todo request chega com o mesmo req.ip e
  // o limitador por IP vira global: 10 logins errados de um usuário bloqueavam
  // o login de todos por 15 minutos. O número de hops é configurável porque
  // confiar em proxy demais permitiria forjar X-Forwarded-For.
  const trustedProxyHops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
  app.set('trust proxy', Number.isFinite(trustedProxyHops) ? trustedProxyHops : 1);

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

  // Rota inexistente devolvia a página HTML padrão do Express para um cliente
  // que só entende JSON.
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Sem error handler, JSON malformado escapava para o handler padrão do Express,
  // que responde HTML e inclui err.stack fora de produção.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    logControllerError('app', `${req.method} ${req.path}`, error);
    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON inválido' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = createApp();
