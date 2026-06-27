# Question — Sistema de Gestão de Questões Educacionais

Sistema para geração e gerenciamento de questões educacionais com IA, desenvolvido com NestJS, Next.js e PostgreSQL.

## Funcionalidades

- **Autenticação** — Registro, login e refresh token JWT
- **Disciplinas e Tópicos** — Organização hierárquica do conteúdo
- **Questões** — Criação manual ou via IA, com suporte a múltipla escolha e descritivas
- **Provas** — Montagem de provas com seleção manual ou automática de questões, reordenação e pontuação
- **Aulas com IA** — Geração de aulas completas (conteúdo + questões) a partir de um tema via DeepSeek

## Tecnologias

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Backend    | NestJS, TypeORM, PostgreSQL       |
| Frontend   | Next.js 16, React 19, Tailwind 4  |
| Auth       | JWT (access + refresh token)      |
| IA         | DeepSeek API                      |
| Infra      | Docker, Docker Compose            |

## Estrutura do Projeto

```
.
├── backend/        # API NestJS (porta 3001)
├── frontend/       # App Next.js (porta 3000)
├── docker-compose.yml
└── package.json    # Workspace raiz (npm workspaces)
```

## Pré-requisitos

- Docker e Docker Compose
- Uma chave de API do [DeepSeek](https://platform.deepseek.com)

## Configuração

```bash
cp .env.example .env
```

Edite o `.env` e preencha:

```env
DB_PASSWORD=question_pass
JWT_SECRET=troque-em-producao
DEEPSEEK_API_KEY=sua-chave-aqui
```

## Subindo a aplicação

```bash
docker-compose up --build
```

| Serviço   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3000       |
| API       | http://localhost:3001/api   |
| pgAdmin   | http://localhost:5050       |
| Postgres  | localhost:5432              |

O banco de dados é criado automaticamente na primeira inicialização.

## pgAdmin

Acesse http://localhost:5050 com `admin@admin.com` / `admin` e cadastre o servidor:

- **Host:** `postgres`
- **Port:** `5432`
- **Database:** `question_db`
- **Username:** `question_user`
- **Password:** `question_pass`

## Desenvolvimento local (sem Docker)

```bash
npm install
```

Suba apenas o banco:

```bash
docker-compose up postgres -d
```

Rode backend e frontend em paralelo:

```bash
npm run dev
```

## Scripts disponíveis

| Comando                        | Descrição                          |
|--------------------------------|------------------------------------|
| `npm run dev`                  | Sobe backend e frontend juntos     |
| `npm run dev:backend`          | Só o backend em modo watch         |
| `npm run dev:frontend`         | Só o frontend                      |
| `npm run build`                | Build de produção dos dois         |
| `npm run db:migration:generate`| Gera migration TypeORM             |
| `npm run db:migration:run`     | Executa migrations pendentes       |

## Banco de dados

| Tabela           | Descrição                                      |
|------------------|------------------------------------------------|
| `users`          | Usuários e credenciais                         |
| `refresh_tokens` | Tokens de refresh JWT                          |
| `subjects`       | Disciplinas por usuário                        |
| `topics`         | Tópicos por disciplina                         |
| `questions`      | Questões (múltipla escolha e descritivas)      |
| `alternatives`   | Alternativas A/B/C/D das questões              |
| `exams`          | Provas montadas pelo usuário                   |
| `exam_questions` | Relação prova ↔ questão (ordem e pontuação)   |
