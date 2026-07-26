const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const postRoutes = require('./modules/posts/post.routes');
const professorRoutes = require('./modules/professores/professor.routes');
const alunoRoutes = require('./modules/alunos/aluno.routes');
const authRoutes = require('./modules/auth/auth.routes');
const { getConfig } = require('./config/env');
const { createCorsOptions } = require('./config/cors');

const config = getConfig();
const app = express();

app.use(helmet());
app.use(cors(createCorsOptions(config)));

app.use(express.json());

// Rate limit no login: mitiga brute-force de credenciais sem substituir o Bearer JWT.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/posts', postRoutes);
app.use('/professores', professorRoutes);
app.use('/alunos', alunoRoutes);
app.use('/auth/login', loginLimiter);
app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
