# Multi-Tenant Next.js Application - Installation Guide

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd multi-tenant-nextjs
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/multi-tenant-nextjs"

# JWT Secrets
JWT_ACCESS_SECRET="your-access-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Next.js
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (optional for production)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database with comprehensive sample data
node scripts/seed-comprehensive-data.js
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Access Credentials

### Superadmin Access
- **URL**: http://localhost:3000/superadmin/login
- **Email**: admin@superadmin.com
- **Password**: AdminPass123

### Tenant Access

#### TechCorp Solutions
- **URL**: http://localhost:3000/techcorp/login
- **Admin**: admin@techcorp.com / AdminPass123
- **Manager**: manager@techcorp.com / AdminPass123
- **User**: user@techcorp.com / AdminPass123
- **Viewer**: viewer@techcorp.com / AdminPass123

#### Global Retail Inc
- **URL**: http://localhost:3000/globalretail/login
- **Admin**: admin@globalretail.com / AdminPass123
- **Manager**: manager@globalretail.com / AdminPass123
- **User**: user@globalretail.com / AdminPass123
- **Viewer**: viewer@globalretail.com / AdminPass123

## User Roles & Permissions

### Tenant Admin
- Full access to all features
- Can manage users, roles, and permissions
- Can access all modules with full CRUD operations
- Can manage tenant modules and settings

### Tenant Manager
- Limited management access
- Can manage users and content
- Can view roles and settings
- Can create and manage support tickets
- Cannot delete users or modify system settings

### Tenant User
- Basic user access
- Can view dashboard and notifications
- Can create support tickets
- Limited editing capabilities

### Read-only User (Viewer)
- View-only access to dashboard and notifications
- Can view support tickets
- Cannot create, edit, or delete anything
- Perfect for auditors and viewers

## Available Modules

1. **Dashboard** - Overview and analytics
2. **User Management** - Manage tenant users
3. **Role & Permission Management** - Configure access rights
4. **Module Management** - Enable/disable features
5. **Audit Logs** - Activity tracking and system logs
6. **Support System** - Create and manage support tickets
7. **Notifications** - System notifications and alerts
8. **Settings** - System configuration

## Database Schema Overview

### Core Entities
- **SuperAdmin**: Platform administrators
- **Tenant**: Multi-tenant organizations
- **User**: Tenant-specific users
- **Role**: User roles with permissions
- **Module**: Available system modules
- **Permission**: Granular access controls

### Supporting Entities
- **TenantModule**: Module availability per tenant
- **UserRole**: User-role assignments
- **RolePermission**: Role-permission mappings
- **Notification**: System notifications
- **UserNotification**: User-specific notification delivery
- **SupportTicket**: Support system tickets
- **SupportTicketComment**: Ticket comments
- **AuditLog**: System activity tracking
- **SystemSetting**: Global system configuration

### Key Features
- **Multi-tenancy**: Complete tenant isolation
- **Role-based Access Control**: Granular permissions
- **Dynamic Module Management**: Enable/disable features per tenant
- **Comprehensive Audit Logging**: Track all system activities
- **Support System**: Built-in ticket management
- **Notification System**: Real-time alerts and notifications

## Sample Data Included

The seeding script creates comprehensive sample data:

### SuperAdmin
- 1 SuperAdmin account with full platform access

### Tenants
- **TechCorp Solutions**: Technology company (Enterprise plan)
- **Global Retail Inc**: Retail chain (Professional plan)

### Users per Tenant
- **Admin**: Full administrative access
- **Manager**: Management level access
- **User**: Standard user access
- **Viewer**: Read-only access

### Sample Data
- **Notifications**: 3 system notifications
- **Support Tickets**: 4 sample tickets with comments
- **Audit Logs**: 50 sample activity logs
- **System Settings**: 6 configuration settings

## Troubleshooting

### Database Connection Issues
```bash
# Check database connection
npx prisma db push

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Re-seed data after reset
node scripts/seed-comprehensive-data.js
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Permission Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Check database schema
npx prisma db pull
```

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong JWT secrets (32+ characters)
- Configure proper database credentials
- Set up email service for password resets
- Enable SSL/TLS for database connections

### Database Considerations
- Use connection pooling for MySQL
- Set up proper database backups
- Configure appropriate MySQL settings for production
- Monitor database performance

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access Control**: Granular permission system
- **Audit Logging**: Complete activity tracking
- **Tenant Isolation**: Complete data separation
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## Support

For issues and questions, please check the project documentation or create an issue in the repository.

### Common Issues
1. **Database connection fails**: Check DATABASE_URL and MySQL service
2. **Permission denied**: Ensure proper file permissions and database access
3. **Module not found**: Run `npm install` to install dependencies
4. **Build errors**: Clear cache with `rm -rf .next` and rebuild 