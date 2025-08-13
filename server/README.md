# Multi-Tenant Backend

A scalable multi-tenant SaaS platform backend built with TypeScript, Express, and MySQL.

## Features

- Multi-tenant architecture with tenant isolation
- Role-based access control (RBAC)
- JWT authentication with refresh tokens
- Dynamic modules and menus
- Support ticket system
- Audit logging
- API standards with pagination, search, filtering
- Comprehensive testing suite

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with RSA keys
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS, Rate limiting

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database and JWT configuration
```

3. Set up the database:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Start development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## API Documentation

The API follows RESTful conventions and returns standardized JSON responses:

```json
{
  "success": true|false,
  "message": "string",
  "data": any,
  "errors": any|null,
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── validation/      # Zod validation schemas
└── index.ts         # Application entry point
```

## Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - MySQL connection string
- `JWT_PRIVATE_KEY_PATH` - Path to RSA private key
- `JWT_PUBLIC_KEY_PATH` - Path to RSA public key
- `JWT_SECRET` - Fallback HMAC secret
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Testing

The project includes comprehensive testing:

- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests with test database

Run tests with:

```bash
npm test
```

## Security

- JWT authentication with RSA keys
- Role-based access control
- Rate limiting
- Input validation with Zod
- SQL injection protection via Prisma
- CORS configuration
- Security headers with Helmet

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting
