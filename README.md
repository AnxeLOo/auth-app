# Aplicação Full-Stack de Autenticação Segura (Backend API & Frontend React)

Aplicação completa de autenticação com separação de responsabilidades, arquitetura limpa, alta confiabilidade e segurança:
- **Backend API:** Desenvolvida em **Node.js**, **Express.js**, **TypeScript**, **H2 Database** (Modo Server com emulação PostgreSQL) e **Redis** para gerenciamento de sessões e rate limiting em memória.
- **Frontend SPA:** Desenvolvida em **React 18**, **TypeScript**, **Vite**, **Vanilla CSS Design System**, **Jest** e **React Testing Library**, com gerenciamento centralizado de sessão, validação em tempo real, rotas protegidas e **integração com API simulada externa (DummyJSON)** para consumo e exibição dinâmica de catálogo de produtos com busca, filtros e modal.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **Framework & UI:** [React](https://react.dev/) (v18) com [TypeScript](https://www.typescriptlang.org/) (v5)
- **Build Tool & Bundler:** [Vite](https://vitejs.dev/) (v6)
- **Roteamento SPA:** [React Router](https://reactrouter.com/) (v6) com rotas protegidas (`ProtectedRoute`)
- **Comunicação HTTP & APIs:**
  - [Axios](https://axios-http.com/) para API de Autenticação segura com interceptors, Bearer Token em memória e auto-refresh
  - Cliente HTTP isolado para a **API Simulada de Dummy Data** ([DummyJSON](https://dummyjson.com/)), com busca, paginação e categorias
- **Estilização:** Vanilla CSS moderno com Design System customizado (dark mode refinado, variáveis CSS, micro-animações, cards glassmorphic, modal responsivo e responsividade mobile-first)
- **Testes Automatizados:** [Jest](https://jestjs.io/) e [React Testing Library](https://testing-library.com/) com `jest-environment-jsdom` e `@testing-library/user-event`
- **Deploy:** Pronto para [Vercel](https://vercel.com/) (`vercel.json`) e [Netlify](https://www.netlify.com/) (`netlify.toml` e `public/_redirects`)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (v22+) & [TypeScript](https://www.typescriptlang.org/)
- **Framework HTTP:** [Express.js](https://expressjs.com/) (v5)
- **Banco de Dados Relacional:** [H2 Database](https://www.h2database.com/) (v2.3) em Modo Server com emulação de protocolo PostgreSQL
- **Gerenciador de Sessões em Memória:** [Redis](https://redis.io/) (v7 Alpine)
- **Segurança & Criptografia:**
  - Hashing de senhas: **Argon2id** (`@node-rs/argon2`)
  - Tokens: **JSON Web Tokens (JWT)** assinado com HS256
  - Proteção contra força bruta: **Rate Limiting** persistido no Redis (`express-rate-limit` + `rate-limit-redis`)
  - Cabeçalhos HTTP: **Helmet** e **CORS** configurável
- **Validação de Dados:** [Zod](https://zod.dev/) para DTOs e variáveis de ambiente
- **Orquestração de Contêineres:** Docker & Docker Compose
- **Testes Backend:** [Vitest](https://vitest.dev/) & [Supertest](https://github.com/ladjs/supertest)

---

## 📁 Estrutura do Repositório

```
auth-app/
├── src/                      # Código-fonte do Backend (Express + TypeScript)
│   ├── app.ts                # Inicialização do Express, middlewares e CORS
│   ├── server.ts             # Servidor HTTP com graceful shutdown
│   ├── controllers/          # Controladores HTTP de autenticação
│   ├── services/             # Regras de negócio (AuthService, SessionService)
│   ├── repositories/         # Persistência relacional H2 via PG wire protocol
│   ├── schemas/              # DTOs e validações Zod
│   ├── middlewares/          # Autenticação JWT, rate limiter, validação
│   └── database/             # Migrations e scripts de Seed
├── tests/                    # Suíte de testes automatizados do Backend (Vitest)
│   ├── unit/                 # Testes unitários (hashing, JWT, auth service)
│   └── integration/          # Testes de integração HTTP (supertest)
├── docker-compose.yml        # Orquestração do Backend, H2 e Redis
├── frontend/                 # Aplicação Frontend React (Task 2)
│   ├── src/
│   │   ├── index.css         # Design tokens, base styles, produtos e modal (Vanilla CSS)
│   │   ├── App.tsx           # Setup do Router e AuthProvider
│   │   ├── types/            # Modelos TypeScript (auth.types.ts, product.types.ts)
│   │   ├── services/         # Clientes HTTP (api.ts para Auth, dummyApi.ts e products.service.ts)
│   │   ├── context/          # AuthContext e gerenciamento centralizado de sessão
│   │   ├── hooks/            # Hook useAuth customizado
│   │   ├── components/       # Componentes reutilizáveis (Navbar, Alert, Spinner, ProtectedRoute, ProductCard, ProductCatalog, ProductDetailModal)
│   │   ├── pages/            # Telas (LoginPage, RegisterPage, DashboardPage com catálogo, NotFoundPage)
│   │   └── tests/            # Testes unitários e de integração do Frontend (Jest + RTL)
│   ├── vercel.json           # Configuração de SPA rewrites para Vercel
│   ├── netlify.toml          # Configuração de SPA redirects para Netlify
│   ├── vite.config.ts        # Configuração do Vite, defines e proxy local
│   ├── jest.config.cjs       # Configuração do Jest com ts-jest e jsdom
│   └── package.json          # Dependências e scripts do frontend
└── README.md                 # Documentação completa
```

---

## 🔒 Fluxo de Autenticação e Segurança

### 1. Cadastro de Usuário (`/register`)
- Validações em tempo real no cliente antes do envio:
  - Nome: mínimo 2 caracteres, máximo 100 caracteres.
  - E-mail: formato válido e limite de tamanho.
  - Senha: no mínimo 8 caracteres, com checklist visual dinâmico (maiúscula, minúscula e número).
  - Confirmação de senha: checagem de igualdade estrita.
- Envia `POST /api/auth/register`. Ao obter sucesso, o usuário é imediatamente logado e redirecionado para a área restrita.

### 2. Login (`/login`)
- Formulário com validação de campos obrigatórios e formato de e-mail.
- Botão de alternar visibilidade de senha (*show/hide password*).
- Envia `POST /api/auth/login`. Recebe `accessToken` (15m), `refreshToken`, `sessionId` e dados do perfil.
- Redireciona para `/dashboard` (ou rota anteriormente protegida solicitada).

### 3. Estratégia Segura de Armazenamento de Tokens e Sessão
- **Access Token:** Mantido **estritamente em memória** no estado do `AuthContext` do React para mitigar riscos de roubo persistente via ataques XSS.
- **Sessão de Renovação:** `sessionId` e `refreshToken` são armazenados em `sessionStorage` (que é isolado por aba do navegador e automaticamente destruído ao fechar a aba/janela, prevenindo persistência indesejada de longa duração em disco/localStorage).
- **Injeção Automática de Cabeçalho:** O interceptor Axios anexa `Authorization: Bearer <accessToken>` em todas as requisições autenticadas.
- **Renovação Automática (Refresh Token):** Caso um request protegido receba HTTP 401, o interceptor do Axios tenta automaticamente uma chamada `POST /api/auth/refresh`, obtém novos tokens, atualiza o estado e reexecuta a requisição original de forma transparente para o usuário.
- **Restauração de Sessão:** Ao carregar ou recarregar o aplicativo, o `AuthProvider` detecta a sessão ativa em `sessionStorage`, renova as credenciais via API e restaura os dados do usuário, sem exibir flashes de tela de login.

### 4. Área Autenticada e Proteção de Rotas (`/dashboard`)
- A rota `/dashboard` é protegida pelo componente `ProtectedRoute`.
- Caso o usuário não esteja autenticado, é redirecionado para `/login` preservando a rota de origem (`state: { from: location }`).
- Durante a validação assíncrona inicial de sessão, exibe tela de carregamento elegante com spinner centralizado.
- Exibe dados do usuário autenticado (ID, Nome, E-mail, data de criação), status da sessão ativa e botão para revalidar conectividade diretamente no endpoint protegido `GET /api/auth/me`.

### 5. Logout (`/logout`)
- Pode ser disparado pelo botão da barra de navegação ou pelo dashboard.
- Envia `POST /api/auth/logout` com `sessionId` e Bearer token para invalidar a sessão no Redis do backend.
- Limpa o Access Token em memória e expurga os dados do `sessionStorage`.
- Redireciona o usuário imediatamente para a tela de login.

---

## 🛍️ Integração com API Simulada (Dummy Data)

A aplicação consome a API pública externa **[DummyJSON](https://dummyjson.com/)** (`https://dummyjson.com/products`) em uma seção interativa no Dashboard do usuário autenticado:

### 1. Arquitetura e Segurança da Conexão
* **Isolamento de Clientes HTTP:** Um cliente Axios dedicado (`dummyApi.ts`) foi implementado com `baseURL` apontando para a DummyJSON, completamente separado do cliente de autenticação (`api.ts`).
* **Proteção contra Vazamento de Credenciais:** O cliente da DummyJSON **não** injeta o `Authorization: Bearer <accessToken>` do usuário e não executa o fluxo de renovação de refresh token, garantindo que credenciais sensíveis nunca sejam transmitidas para servidores de terceiros.
* **Configurabilidade:** O endpoint é configurável via `VITE_DUMMY_API_URL`, permitindo apontar para outros provedores ou mocks locais caso necessário.

### 2. Recursos do Catálogo de Produtos
* **Busca em Tempo Real com Debounce:** Campo de busca com debounce de 400ms (`GET /products/search?q={termo}`) para evitar requisições excessivas enquanto o usuário digita, acompanhado de botão para limpar o termo pesquisado.
* **Filtro por Categorias Dinâmicas:** Consulta o endpoint `GET /products/categories` para popular um dropdown de categorias, filtrando os produtos por categoria específica (`GET /products/category/{categoria}`).
* **Paginação Server-Side Simulada:** Controles de "Anterior" e "Próxima" com indicador dinâmico de itens exibidos e total de páginas disponíveis.
* **Cards Ricos com Micro-Interações:** Imagens com fallback automático, badges de categoria e percentual de desconto, avaliação em estrelas (rating), preço original riscado e preço promocional em destaque.
* **Modal de Detalhes:** Exibe galeria de imagens interativa, descrição completa, status e quantidade em estoque, marca, tags e classificação.
* **Feedback Visual:** Estados de carregamento com *Spinner*, estado vazio amigável quando nenhum produto é encontrado e alerta com mensagem de erro caso a chamada de rede falhe.

---

## ⚙️ Variáveis de Ambiente

### Backend (`.env` na raiz)
Crie um arquivo `.env` na raiz a partir de `.env.example`:
```bash
cp .env.example .env
```
Principais configurações:
- `PORT=3000`
- `NODE_ENV=development`
- `CORS_ORIGIN=*`
- `H2_HOST=localhost` / `H2_PORT=5435` / `H2_DATABASE=authdb`
- `REDIS_HOST=localhost` / `REDIS_PORT=6379`
- `JWT_SECRET=super_secret_jwt_key_auth_app_dev_test_change_in_production_32chars`
- `JWT_EXPIRES_IN=15m`
- `REFRESH_TOKEN_EXPIRES_IN_SECONDS=604800`

### Frontend (`frontend/.env`)
Crie um arquivo `.env` dentro de `frontend/` a partir de `frontend/.env.example`:
```bash
cp frontend/.env.example frontend/.env
```
Configuração:
```env
# Em desenvolvimento local, o Vite encaminha '/api' para 'http://localhost:3000/api'
# Em produção, configure com a URL do seu backend implantado:
VITE_API_BASE_URL=/api

# Base URL da API Simulada (Dummy Data):
VITE_DUMMY_API_URL=https://dummyjson.com
```

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- **Node.js** (v20+) e **npm** (v9+)
- **Docker** e **Docker Compose** (recomendado para rodar H2 e Redis do backend)

---

### Opção 1: Backend com Docker + Frontend Local (Recomendado)

1. **Subir os serviços do backend (Node.js, H2 Database e Redis):**
```bash
docker compose up -d --build
```
A API estará pronta em `http://localhost:3000` (Healthcheck: `http://localhost:3000/health`).

2. **Iniciar o frontend React (a partir da raiz):**
```bash
npm run dev:frontend
```
*Ou entrando na pasta frontend:*
```bash
cd frontend
npm install
npm run dev
```

3. **Acesse no navegador:**
👉 **`http://localhost:5173`**

---

### Opção 2: Backend e Frontend sem Docker

1. Instalar dependências em ambas as pastas:
```bash
npm install
npm --prefix frontend install
```

2. Certifique-se de que o servidor H2 (porta 5435) e Redis (porta 6379) estejam rodando localmente.

3. Iniciar o backend e frontend:
```bash
npm run dev          # Terminal 1 (Backend na porta 3000)
npm run dev:frontend # Terminal 2 (Frontend na porta 5173)
```

---

## 🧪 Testes Automatizados

O projeto conta com **61 testes automatizados** distribuídos entre Backend (Vitest) e Frontend (Jest + React Testing Library).

### 1. Executar TODOS os testes do projeto (Backend + Frontend):
```bash
npm test
```

### 2. Executar apenas os testes do Frontend:
```bash
npm run test:frontend
```
*Ou dentro da pasta `frontend/`:*
```bash
cd frontend
npm test
```

### 3. Executar apenas os testes do Backend:
```bash
npm run test:backend
```

### 4. Gerar relatório de cobertura de testes do Frontend:
```bash
npm --prefix frontend run test:coverage
```

### 5. Verificação estática de tipos (TypeScript):
```bash
npm run typecheck
```

---

### 📋 Suíte de Testes do Frontend (Jest + React Testing Library)

| Arquivo de Teste | Tipo | Componente / Recurso Coberto | Cenários Testados |
|---|---|---|---|
| `LoginForm.test.tsx` | Unitário | `LoginPage` | Renderização de inputs, validação de campos obrigatórios, formato de e-mail, alternar visibilidade de senha, submissão com credenciais válidas, tratamento de erro da API. |
| `RegisterForm.test.tsx` | Unitário | `RegisterPage` | Renderização de campos, validação de obrigatórios, checklist dinâmico de regras de senha (tamanho, maiúscula, minúscula, número), confirmação de senha, fluxo de sucesso e erro 409 (e-mail duplicado). |
| `ProtectedRoute.test.tsx` | Unitário | `ProtectedRoute` | Estado de carregamento (*loading spinner*), redirecionamento de desautenticado para `/login`, renderização de rota protegida para autenticado. |
| `useAuth.test.tsx` | Unitário | Hook `useAuth` e `AuthContext` | Exceção fora do provider, estado inicial, execução de login com persistência em sessionStorage, logout com limpeza de estado e chamada da API, restauração automática de sessão. |
| `api.test.ts` | Unitário | `services/api.ts` | Gerenciamento de token em memória, persistência em sessionStorage, parsing de mensagens amigáveis de erro (rede, 401, 400, Zod, exceções genéricas). |
| `products.service.test.ts` | Unitário | `services/products.service.ts` | Listagem com paginação sem filtros, busca por termo (`/products/search`), filtro por categoria (`/products/category/{cat}`), normalização de categorias da DummyJSON e detalhes por ID (`/products/{id}`). |
| `ProductCatalog.test.tsx` | Integração | `ProductCatalog` & `ProductDetailModal` | Renderização inicial com dados simulados e dropdown de categorias, abertura e fechamento de modal de detalhes, estado vazio amigável quando nenhum item coincide com a busca, tratamento de erro e filtro dinâmico por categoria. |
| `auth-flow.test.tsx` | Integração | Fluxo Completo da Aplicação | Fluxo completo de Login -> Dashboard com dados do usuário e catálogo -> Logout; Fluxo completo de Cadastro com validação -> Dashboard com dados salvos. |

---

## 🌐 Implantação em Produção (Vercel ou Netlify)

O frontend React está preparado para publicação tanto na **Vercel** quanto no **Netlify**, contendo regras de SPA routing para evitar erros 404 em rotas acessadas diretamente ou ao recarregar a página.

### Arquivos de Configuração Inclusos
- **Vercel:** `frontend/vercel.json` (reescreve todas as rotas para `/index.html`).
- **Netlify:** `frontend/netlify.toml` e `frontend/public/_redirects` (redirecionamento com status 200 para `/index.html`).

### Passos para Deploy

#### Opção A: Vercel
1. Conecte o repositório no dashboard da [Vercel](https://vercel.com/new).
2. Configure as seguintes opções do projeto:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Configure as **Variáveis de Ambiente**:
   - `VITE_API_BASE_URL`: URL da sua API backend em produção (ex: `https://auth-api-production.up.railway.app/api`).
4. Clique em **Deploy**.

*Via Vercel CLI (caso tenha instalado):*
```bash
cd frontend
npx vercel
```

#### Opção B: Netlify
1. Conecte o repositório na [Netlify](https://app.netlify.com/start).
2. Defina as configurações de build:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Adicione a variável de ambiente `VITE_API_BASE_URL` apontando para o backend.
4. Clique em **Deploy Site**.

*Via Netlify CLI (caso tenha instalado):*
```bash
cd frontend
npx netlify deploy --prod
```

### URL Pública da Aplicação
- **Ambiente de Produção (Vercel):** [https://frontend-three-fawn-80.vercel.app](https://frontend-three-fawn-80.vercel.app)


---

## 👤 Credenciais Iniciais de Demonstração (Seed & Vercel)

A aplicação conta com suporte nativo às credenciais de demonstração:
- **E-mail:** `user@example.com`
- **Senha:** `Password123!`

### Comportamento por Ambiente:
1. **Ambiente Local (Full-Stack):** Com o backend Docker ativo, a autenticação valida os dados no banco relacional **H2** e persiste as sessões com rate limiting no **Redis**.
2. **Ambiente de Deploy Estático (Vercel):** Caso o backend externo não esteja conectado (ou retorne erro 405/rede), o frontend ativa de forma transparente o **Fallback de Autenticação Simulada (`mockAuth`)**. Você pode:
   * Clicar no botão **"Preencher"** na tela de login para usar as credenciais seed (`user@example.com` / `Password123!`).
   * Ou registrar uma conta nova na tela `/register`.
   * O acesso ao **Dashboard** e ao **Catálogo de Produtos (DummyJSON)** é liberado imediatamente na URL pública.

