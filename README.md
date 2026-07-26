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
# edite .env e preencha:
#   POSTGRES_PASSWORD
#   JWT_SECRET e RATE_LIMIT_SECRET  (32+ caracteres aleatórios, distintos entre si)
#   INITIAL_TEACHER_NAME, INITIAL_TEACHER_EMAIL, INITIAL_TEACHER_PASSWORD
#     (usados no bootstrap descrito adiante — preencha agora para não voltar aqui)
docker compose up --build
```

O banco sobe **vazio**: sem posts e sem nenhuma conta. O login só funciona depois
do bootstrap descrito na próxima seção.

> **Windows:** salve o `.env` com fim de linha **LF**. Com CRLF, cada valor
> termina em carriage return dentro do container Linux: `CORS_ORIGIN` vira
> `http://localhost:8081` e toda requisição do app falha sem erro visível.
> O `.gitattributes` do repositório já força LF nos arquivos versionados.

Serviços disponíveis:

- App web: `http://localhost:8081`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- PostgreSQL: `localhost:55432`

O serviço mobile executa Expo Web. A variável `EXPO_PUBLIC_API_URL` aponta o bundle web para `http://localhost:3000`. O backend inicia em modo de produção e aceita somente as origens exatas definidas por `CORS_ORIGIN`. O `.env.example` usa `http://localhost:8081` para o app web do Compose.

> **Hot reload não funciona pelo container quando o repositório está no filesystem do Windows.**
> O bind mount não entrega eventos de inotify e o watcher do Metro não faz polling.
> Para desenvolver com recarga automática, pare o serviço mobile e rode o Expo direto no host:
> `docker compose stop mobile` e depois, em `mobile/`, `bun install && bunx expo start --web`.
> O backend continua no Docker normalmente.

> Alterações no backend exigem `docker compose up -d --build backend`: a imagem copia
> o código no build, não há volume montado nesse serviço.

### Bootstrap seguro do primeiro professor

O cadastro REST de professores continua protegido: somente um professor autenticado pode cadastrar outros professores. Em banco novo, crie o primeiro professor pelo seed administrativo explícito:

```bash
# na raiz, com o serviço db ativo. As variáveis vêm do .env:
#   INITIAL_TEACHER_NAME, INITIAL_TEACHER_EMAIL, INITIAL_TEACHER_PASSWORD
docker compose --profile bootstrap run --rm seed
```

Fora do Docker, execute no diretório `backend` com as mesmas variáveis definidas
no ambiente:

```bash
npx prisma db seed
```

As três variáveis são obrigatórias. O comando falha sem qualquer uma delas. A senha é persistida somente como hash bcrypt. O seed é idempotente: se já houver professor, não cria nem altera contas. Ele não roda no boot do backend nem em `docker compose up`.

Para parar sem apagar dados do UAT:

```bash
docker compose down
```

Não use `docker compose down -v`: `-v` remove o volume e apaga todos os dados do PostgreSQL.

> **Trocar `POSTGRES_PASSWORD` com o volume já existente derruba o backend.**
> O PostgreSQL só aplica a senha na primeira inicialização do volume; depois disso
> ela vive dentro dele. Se você mudar a senha no `.env` de um ambiente que já rodou,
> o backend falha com `P1000: Authentication failed against database server at 'db'`.
> Ou mantenha a senha original, ou recrie o volume com `docker compose down -v`
> aceitando a perda dos dados.

---

## Setup do app mobile fora do Docker

```bash
# 1. Clonar o repositório
git clone <URL_DO_REPO>
cd blogeducamais-techchallenge-04/mobile

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
├── components/                 # PostCard, SearchBar, EmptyState, ErrorState,
│                               # FieldError, ErrorBoundary
├── config/
│   └── env.js                  # resolve o host da API por plataforma
├── contexts/
│   └── AuthContext.jsx         # fonte de verdade da sessão do professor
├── hooks/
│   └── usePaginatedCrudList.js # paginação por offset com dedupe por id
├── navigation/
│   ├── RootNavigator.jsx       # troca a stack inteira (PublicStack vs AdminStack)
│   ├── PublicStack.jsx         # leitura pública
│   └── AdminStack.jsx          # área autenticada + botão de saída
├── screens/
│   ├── admin/                  # AdminHomeScreen (hub administrativo)
│   ├── alunos/                 # lista + formulário (criar/editar)
│   ├── auth/                   # LoginScreen
│   ├── posts/                  # lista pública, leitura, admin, formulário
│   ├── professores/            # lista + formulário (criar/editar)
│   └── shared/
│       └── CrudListScreen.jsx  # listagem administrativa reusada por
│                               # professores e alunos
├── services/
│   ├── api/client.js           # Bearer só em rota privada; invalida sessão em 401
│   ├── session/sessionStore.js # token em memória + pub/sub de invalidação
│   ├── postsService.js         # CRUD de posts
│   ├── professoresService.js   # CRUD de professores
│   ├── alunosService.js        # CRUD de alunos
│   └── authService.js          # login real (POST /auth/login)
├── theme/
│   └── tokens.js               # spacing, colors, typography centralizados
└── utils/
    ├── dialogs.js              # confirmação destrutiva (window.confirm na web,
    │                           # Alert nativo no mobile)
    ├── requestError.js         # classificação única de erro de requisição
    └── validators.js           # regras de email, nome e senha dos formulários
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
- A identidade atual do professor é revalidada a cada requisição protegida. Se o professor for excluído, seu token ainda assinado passa a retornar `401` imediatamente, antes de qualquer mutação.
- Sem HTTPS — ambiente acadêmico local/dev. Uma implantação pública deve terminar TLS antes de transmitir credenciais ou tokens.

---

## Validação

O projeto não possui suíte de testes automatizados — o desafio não os exige.
A validação é funcional, contra o ambiente real:

```bash
# backend de pé e respondendo
curl -s http://localhost:3000/health

# leitura pública, sem token
curl -s http://localhost:3000/posts

# rota administrativa exige credencial (deve responder 401)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/professores
```

Bundle web do app:

```bash
cd mobile
bun install --frozen-lockfile
bunx expo export --platform web
```

Fluxo mínimo para conferir que a stack inteira está de pé, com o token obtido no
login do professor criado pelo bootstrap:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"SEU_EMAIL","senha":"SUA_SENHA"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

# criar um post (deve responder 201; o autor vem do token, não do corpo)
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/posts \
  -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Aula inaugural","content":"Primeiro post do ambiente."}'

# o post recém-criado já aparece na leitura pública
curl -s http://localhost:3000/posts
```
