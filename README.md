# Blog EducaMais — App Mobile (Tech Challenge Fase 04)

> App React Native (Expo) onde o professor autenticado gerencia posts, professores e alunos; o aluno lê e busca posts sem precisar de login.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (LTS mais recente)
- [bun](https://bun.sh/) — gerenciador de pacotes usado pelo projeto (`bun.lock` presente em `mobile/`)
- [Expo Go](https://expo.dev/go) instalado no celular (Android/iOS), **ou** emulador Android/simulador iOS configurado
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose v2) — necessário para rodar o backend

---

## Execução completa com Docker

Banco, backend e versão web do app mobile sobem juntos:

```bash
# na raiz deste repositório
cp .env.example .env
# edite .env e troque JWT_SECRET por um segredo aleatório com 32+ caracteres
docker compose up --build
```

Serviços disponíveis:

- App web: `http://localhost:8081`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- PostgreSQL: `localhost:55432`

O serviço mobile executa Expo Web com Fast Refresh. O código-fonte fica montado no container; alterações salvas em `mobile/` são recarregadas no navegador. A variável `EXPO_PUBLIC_API_URL` aponta o bundle web para `http://localhost:3000`. O backend inicia em modo de produção e aceita somente as origens exatas definidas por `CORS_ORIGIN`. O `.env.example` usa `http://localhost:8081` para o app web do Compose.

Para parar sem apagar dados do UAT:

```bash
docker compose down
```

Não use `docker compose down -v` durante o UAT: `-v` remove o volume e apaga dados do PostgreSQL.

---

## Setup do app mobile fora do Docker

```bash
# 1. Clonar o repositório
git clone <URL_DO_REPO>
cd blogeducamais-techchallenge-fase04/mobile

# 2. Instalar dependências
bun install

# 3. Configurar variáveis de ambiente
cp .env.example .env
```

### Configurando o host do backend

O client HTTP resolve `EXPO_PUBLIC_API_URL` com fallback automático por plataforma (`mobile/src/config/env.js`):

| Cenário | Host resolvido | Precisa configurar `.env`? |
|---------|-----------------|------------------------------|
| Emulador Android | `http://10.0.2.2:3000` | Não — fallback automático |
| Simulador iOS / Web | `http://localhost:3000` | Não — fallback automático |
| Device físico (celular real via Expo Go) | — | **Sim** — definir `EXPO_PUBLIC_API_URL` no `.env` apontando para o IP LAN da máquina que roda o backend (ex.: `http://192.168.0.10:3000`) |

### Rodando o app

```bash
bunx expo start
```

Escaneie o QR code exibido no terminal com o app Expo Go, ou pressione `a` (Android) / `i` (iOS) no terminal para abrir no emulador/simulador.

---

## Arquitetura

Estrutura de pastas (`mobile/src/`):

```
src/
├── services/
│   ├── api/client.js          # injeta Bearer JWT e invalida sessão após 401
│   ├── postsService.js        # CRUD de posts
│   ├── professoresService.js  # CRUD de professores
│   ├── alunosService.js       # CRUD de alunos
│   └── authService.js         # login real (POST /auth/login)
├── screens/
│   ├── posts/                 # lista pública, leitura, admin, formulário
│   ├── professores/           # lista + formulário (criar/editar)
│   ├── alunos/                # lista + formulário (criar/editar)
│   ├── auth/                  # LoginScreen
│   └── admin/                 # AdminHomeScreen (hub administrativo)
├── navigation/
│   └── RootNavigator.jsx       # troca a stack inteira (PublicStack vs AdminStack)
├── contexts/
│   └── AuthContext.jsx         # fonte de verdade da sessão do professor
└── theme/
    └── tokens.js                # spacing, colors, typography centralizados
```

**Navegação condicional:** `RootNavigator` decide entre `PublicStack` (leitura/busca de posts, sem login) e `AdminStack` (hub administrativo) com base em `AuthContext.isAuthenticated`. A troca acontece na raiz do app — nenhuma tela individual precisa verificar permissão por conta própria.

**Fluxo de autenticação:**

1. `LoginScreen` coleta email/senha e chama `authService.login(email, senha)`, que faz `POST /auth/login` contra o backend.
2. O backend valida a senha e responde `{ token, professor }`. O token é assinado com HS256 e expira em `JWT_EXPIRES_IN` (padrão: `8h`).
3. `AuthContext` mantém e persiste `{ token, professor }` em `AsyncStorage`; a senha nunca integra a sessão.
4. O interceptor de `client.js` injeta `Authorization: Bearer <token>` nas requisições autenticadas.
5. Uma resposta `401` invalida a sessão via pub/sub do `sessionStore`; `AuthContext` limpa a persistência e a UI volta imediatamente à stack pública.

---

## Guia de uso

**Área pública (sem login):** lista de posts, busca por palavra-chave, leitura do conteúdo completo.

**Área administrativa (login obrigatório):** após autenticar, o professor cai no hub "Administração", com 3 seções:

- **Posts** — criar, editar, listar (paginado) e excluir
- **Professores** — criar, editar, listar (paginado, infinite scroll) e excluir
- **Alunos** — criar, editar, listar (paginado, infinite scroll) e excluir (sem campo de credencial — aluno não tem senha no model)

---

## Segurança da sessão

- Rotas administrativas exigem `Authorization: Bearer <token>`; `x-user-type` não é aceito como fallback.
- O backend verifica assinatura, expiração, papel `teacher` e restringe o algoritmo a HS256.
- `JWT_SECRET` é obrigatório no boot e precisa ter pelo menos 32 caracteres. `JWT_EXPIRES_IN` usa `8h` por padrão.
- `CORS_ORIGIN` é obrigatório. Produção aceita somente as origens exatas configuradas e nunca wildcard. Desenvolvimento também permite `localhost:5173`, `localhost:8081` e URLs `exp://` em loopback/LAN.
- O token fica no `AsyncStorage` para sobreviver a reaberturas. Não há refresh token; após expiração, a resposta `401` encerra a sessão e exige novo login.
- Sem HTTPS — ambiente acadêmico local/dev. Uma implantação pública deve terminar TLS antes de transmitir credenciais ou tokens.

---

## Testes

Backend (requer PostgreSQL migrado e as variáveis obrigatórias):

```bash
cd backend
npm test
```

O mobile não possui infraestrutura de testes automatizados. Valide o bundle web com Bun:

```bash
cd mobile
bun install --frozen-lockfile
bunx expo export --platform web
```

A validação funcional continua disponível via Expo Go contra o backend real.
