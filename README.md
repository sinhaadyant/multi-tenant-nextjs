# Multi-Tenant Next.js SuperAdmin Dashboard

A comprehensive multi-tenant application with a powerful SuperAdmin dashboard for managing tenants, users, roles, and system-wide operations.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- SuperAdmin role-based access control
- Secure password hashing with bcrypt
- Comprehensive audit logging

### 🏢 Tenant Management
- Create, read, update, delete tenants
- Tenant-specific user management
- Plan-based tenant features (Starter, Professional, Enterprise)
- Regional deployment support

### 👥 User Management
- Cross-tenant user management
- Role-based user permissions
- User activity tracking
- Bulk user operations

### 🔒 Role & Permission System
- Flexible role-based access control
- Granular permissions per module
- Global and tenant-specific roles
- Permission assignment management

### 📊 Audit & Monitoring
- Comprehensive audit logging
- User activity tracking
- System-wide activity monitoring
- Export capabilities

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Dark/Light theme support
- AG Grid for data tables
- Lucide React icons
- Real-time search and filtering

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **UI**: Tailwind CSS, Lucide React, AG Grid
- **Icons**: Lucide React
- **Charts**: ApexCharts

## Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd multi-tenant-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/multi_tenant_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Environment
NODE_ENV="development"
```

4. Set up the database:
```bash
# Run database setup (creates tables and seeds initial data)
npm run setup-db
```

## Database Setup

The setup script will:
- Generate Prisma client
- Push database schema to MySQL
- Create initial SuperAdmin account
- Seed sample data (tenants, roles, permissions)

### Default SuperAdmin Credentials
- **Email**: `admin@superadmin.com`
- **Password**: `Admin123!`

## Development

1. Start the development server:
```bash
npm run dev
```

2. Access the application:
- **SuperAdmin Dashboard**: http://localhost:3000/superadmin/login
- **Tenant Login**: http://localhost:3000/[tenant-slug]/login

## API Endpoints

### Authentication
- `POST /api/superadmin/auth/login` - SuperAdmin login

### Dashboard
- `GET /api/superadmin/dashboard` - Dashboard overview data

### Tenant Management
- `GET /api/superadmin/tenants` - List all tenants
- `POST /api/superadmin/tenants` - Create new tenant
- `GET /api/superadmin/tenants/[id]` - Get specific tenant
- `PUT /api/superadmin/tenants/[id]` - Update tenant
- `DELETE /api/superadmin/tenants/[id]` - Soft delete tenant

### User Management
- `GET /api/superadmin/users` - List all users
- `POST /api/superadmin/users` - Create new user
- `GET /api/superadmin/users/[id]` - Get specific user
- `PUT /api/superadmin/users/[id]` - Update user
- `DELETE /api/superadmin/users/[id]` - Soft delete user

### Role Management
- `GET /api/superadmin/roles` - List all roles
- `POST /api/superadmin/roles` - Create new role
- `PUT /api/superadmin/roles/[id]` - Update role
- `DELETE /api/superadmin/roles/[id]` - Delete role

### Audit Logs
- `GET /api/superadmin/audit-logs` - Get audit logs with filters

### Profile Management
- `GET /api/superadmin/profile` - Get SuperAdmin profile
- `PUT /api/superadmin/profile` - Update SuperAdmin profile

## Database Schema

### Core Models
- **SuperAdmin**: System administrators
- **Tenant**: Multi-tenant organizations
- **User**: Tenant-specific users
- **Role**: User roles and permissions
- **Permission**: Granular system permissions
- **AuditLog**: System activity tracking
- **Notification**: System notifications
- **SupportTicket**: Support ticket management
- **SystemSetting**: Global system settings
- **SystemLog**: System-level logging

## Development Features

### Console Logging
All API endpoints include comprehensive console logging in development mode:
- Request/response logging
- Database query logging
- Error tracking
- Performance monitoring

### Error Handling
- Global error handler with Prisma error mapping
- Structured error responses
- Development stack traces
- Production-safe error messages

### Security Features
- JWT token validation
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- SQL injection prevention via Prisma

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables:
```env
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
```

3. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
