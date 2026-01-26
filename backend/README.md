# PromptFlow Backend

Standalone API server for PromptFlow, built with Hono and Prisma.

## Tech Stack

- **Framework**: [Hono](https://hono.dev/) - Fast, lightweight web framework
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT-based authentication
- **Runtime**: Node.js 20+

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and API keys
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Push database schema

```bash
npx prisma db push
```

### 5. Start development server

```bash
npm run dev
```

Server runs at `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user (protected)

### Templates (protected)
- `GET /api/templates` - List user's templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Jobs (protected)
- `GET /api/jobs` - List user's jobs
- `POST /api/jobs` - Create and start job
- `GET /api/jobs/:id` - Get job details
- `DELETE /api/jobs/:id` - Cancel/delete job

### User (protected)
- `GET /api/user/account` - Get account details
- `PUT /api/user/account` - Update account
- `PUT /api/user/password` - Change password
- `DELETE /api/user/account` - Delete account

### Refine (protected)
- `POST /api/refine/generate` - Generate prompt from description
- `POST /api/refine/refine` - Refine existing prompt
- `POST /api/refine/test` - Test prompt with sample input

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Get the token from the `/api/auth/login` or `/api/auth/register` response.

## Docker

Build and run with Docker:

```bash
docker build -t promptflow-backend .
docker run -p 4000:4000 --env-file .env promptflow-backend
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
