# Blog EducaMais — App Mobile (Tech Challenge Fase 04)

> App React Native (Expo) onde o professor autenticado gerencia posts, professores e alunos; o aluno lê e busca posts sem precisar de login.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (LTS mais recente)
- [bun](https://bun.sh/) — gerenciador de pacotes usado pelo projeto (`bun.lock` presente em `mobile/`)
- [Expo Go](https://expo.dev/go) instalado no celular (Android/iOS), **ou** emulador Android/simulador iOS configurado
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose v2) — necessário para rodar o backend

---

## Setup do backend (pré-requisito)

O app mobile consome o backend REST do repositório irmão `blogeducamais-techchallenge-fase03` (Node.js + Express + Prisma + PostgreSQL). Sem esse backend rodando, **nenhuma tela que depende de rede funciona** — nem a área pública de posts.

```bash
# na raiz do repositório blogeducamais-techchallenge-fase03
docker compose up -d       # ou "docker compose up --build" na primeira execução
```

A API fica disponível em `http://localhost:3000`.

Para parar os serviços: `docker compose down` (ou `docker compose down -v` para remover também o volume do banco).

---

## Setup do app mobile

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
│   ├── api/client.js          # client HTTP centralizado (axios), injeta header x-user-type
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

1. `LoginScreen` coleta email/senha e chama `authService.login(email, senha)`, que faz `POST /auth/login` real contra o backend.
2. `AuthContext` monta a sessão (`{ role, name, id }`, nunca a senha) a partir da resposta do backend.
3. A sessão é propagada em memória via `sessionStore.js` (módulo puro) e persistida best-effort em `AsyncStorage`, apenas para sobreviver a reaberturas do app.
4. O interceptor de `client.js` injeta o header `x-user-type` em toda requisição subsequente, a partir da sessão ativa em `sessionStore`.

---

## Guia de uso

**Área pública (sem login):** lista de posts, busca por palavra-chave, leitura do conteúdo completo.

**Área administrativa (login obrigatório):** após autenticar, o professor cai no hub "Administração", com 3 seções:

- **Posts** — criar, editar, listar (paginado) e excluir
- **Professores** — criar, editar, listar (paginado, infinite scroll) e excluir
- **Alunos** — criar, editar, listar (paginado, infinite scroll) e excluir (sem campo de credencial — aluno não tem senha no model)

---

## Limitações de segurança conhecidas

- O header `x-user-type` é definido pelo próprio client local, a partir da sessão em memória. **Não é um token criptográfico** — pode ser adulterado por quem tiver acesso ao dispositivo ou à rede.
- O login (`POST /auth/login`) valida credenciais reais via bcrypt no backend, mas a sessão pós-login **não usa JWT nem refresh token** — é persistida em `AsyncStorage` apenas como conveniência de UX entre reaberturas do app, nunca como mecanismo de segurança.
- Sem HTTPS — ambiente acadêmico local/dev, fora de escopo deste projeto.
- Este é o mesmo padrão de autenticação herdado desde a Fase 2, documentado desde o início em `PROJECT.md`. **Nunca usar esse padrão em produção real.**

---

## Testes

Testes automatizados no mobile estão explicitamente fora do escopo deste projeto (ver `REQUIREMENTS.md`, seção "Out of Scope"). A validação é manual, via Expo Go contra o backend real.
