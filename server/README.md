# Multi-Tenant SaaS API Backend

A scalable, TypeScript-based multi-tenant SaaS API backend built with Express, Sequelize, and MySQL.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation with customizable login restrictions
- **Role-Based Access Control**: Global and tenant-specific roles with granular permissions
- **Dynamic Menu System**: Hierarchical menu structure with unlimited nesting
- **Authentication & Authorization**: JWT-based auth with refresh tokens and device tracking
- **Support System**: Complete ticket management with attachments and replies
- **Audit Logging**: Comprehensive activity tracking for compliance
- **File Upload**: Secure file handling with validation
- **Advanced Logging**: Environment-based logging with file and console output
- **API Standards**: Consistent response format with pagination, filtering, and search

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Validation**: Zod schema validation
- **Authentication**: JWT with bcrypt password hashing
- **Logging**: Custom logger with environment-based configuration
- **Testing**: Jest with Supabase for E2E tests

## Project Structure

```
src/
├── constants/          # Application constants and limits
├── environment/        # Environment configuration
├── helpers/           # Utility functions and helpers
├── interfaces/        # TypeScript interfaces
├── libraries/         # Third-party library configurations
├── middleware/        # Express middleware
├── models/           # Sequelize database models
├── routes/           # API route handlers
├── services/         # Business logic services
├── validation-schemas/ # Zod validation schemas
├── jwt-keys/         # JWT key storage
└── api-assets/       # Static API assets
```

## Database Schema

### Core Tables

- **users**: User management with tenant isolation
- **tenants**: Tenant information and settings
- **tenant_login_restrictions**: Customizable login policies
- **roles**: Global and tenant-specific roles
- **permissions**: Role-module permission mapping
- **modules**: System modules with ordering
- **menus**: Dynamic menu structure with nesting

### Authentication Tables

- **refresh_tokens**: JWT refresh token storage
- **reset_tokens**: Password reset token management
- **login_devices**: Device tracking and session management

### Support System Tables

- **support_tickets**: Support ticket management
- **support_replies**: Ticket replies and discussions
- **support_attachments**: File attachments for tickets

### Audit & Logging Tables

- **audit_logs**: Comprehensive activity tracking

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/logout` - User logout
- `POST /auth/reset-password` - Request password reset
- `POST /auth/revoke-device` - Revoke device access

### Users

- `GET /users` - List users (with filters, pagination, search)
- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user

### Tenants

- `GET /tenants` - List tenants
- `POST /tenants` - Create tenant
- `GET /tenants/:id` - Get tenant details
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

### Roles & Permissions

- `GET /roles` - List roles
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role
- `POST /roles/:id/permissions` - Assign permissions

### Modules & Menus

- `GET /modules` - List modules
- `POST /modules` - Create module
- `GET /menus` - List menus
- `POST /menus` - Create menu item

### Support System

- `GET /support/tickets` - List support tickets
- `POST /support/tickets` - Create ticket
- `GET /support/tickets/:id` - Get ticket details
- `PUT /support/tickets/:id` - Update ticket
- `POST /support/tickets/:id/replies` - Add reply
- `POST /support/attachments` - Upload attachment

### Audit Logs

- `GET /audit-logs` - View audit logs (with filters)

### Login Devices

- `GET /devices` - List user devices
- `DELETE /devices/:id` - Revoke device

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd multi-tenant-nextjs/server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**

   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE multi_tenant_saas;
   CREATE DATABASE multi_tenant_saas_test;
   ```

5. **Run database migrations**

   ```bash
   npm run db:migrate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Variables

### Required Variables

- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database configuration

### Optional Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production/test)
- `LOG_LEVEL` - Logging level (error/warn/info/debug/trace)
- `CORS_ORIGIN` - CORS allowed origins
- `RATE_LIMIT_MAX_REQUESTS` - Rate limiting configuration

## API Response Format

All API responses follow a consistent format:

```typescript
{
  success: boolean;
  message: string;
  data?: any;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: string[];
}
```

## Authentication

The API uses JWT-based authentication with the following flow:

1. **Login**: User provides credentials, receives access and refresh tokens
2. **Access**: Include `Authorization: Bearer <token>` header for protected routes
3. **Refresh**: Use refresh token to get new access token when expired
4. **Logout**: Invalidate refresh token

## Role-Based Access Control

### Permission Levels

- **Superadmin**: Access to all tenants and global settings
- **Tenant Admin**: Access to own tenant data and settings
- **User**: Limited access based on role permissions

### Permission Actions

- `can_create` - Create new records
- `can_read` - View records
- `can_update` - Modify existing records
- `can_delete` - Delete records

## Multi-Tenant Features

### Tenant Isolation

- All data is scoped to tenant
- Users can only access their tenant's data
- Superadmin can access all tenant data

### Login Restrictions

- Configurable device limits per tenant
- IP whitelist support
- Password expiry policies
- Multiple session control

## Logging

The application uses a custom logger with the following features:

- **Environment-based**: Different log levels for different environments
- **File and Console**: Configurable output destinations
- **Structured**: JSON format in production, readable in development
- **Context-aware**: Includes request ID, user ID, tenant ID
- **Performance tracking**: Request duration and database query timing

### Log Levels

- `ERROR` - Application errors
- `WARN` - Warning messages
- `INFO` - General information
- `DEBUG` - Debug information
- `TRACE` - Detailed tracing

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## Development

### Code Quality

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking

### Database Development

```bash
# Sync database schema
npm run db:reset

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure logging to file
5. Set up reverse proxy (nginx)

### Security Considerations

- Use strong JWT secrets
- Enable HTTPS
- Configure CORS properly
- Set up rate limiting
- Use environment variables for secrets
- Regular security updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository.
