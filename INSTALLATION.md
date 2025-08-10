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

# Seed the database with sample data
node scripts/seed-complete-data.js
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
- **Manager**: manager@techcorp.com / ManagerPass123
- **User**: user@techcorp.com / UserPass123
- **Viewer**: viewer@techcorp.com / ViewerPass123

#### Global Retail Inc
- **URL**: http://localhost:3000/globalretail/login
- **Admin**: admin@globalretail.com / AdminPass123
- **Manager**: manager@globalretail.com / ManagerPass123
- **User**: user@globalretail.com / UserPass123
- **Viewer**: viewer@globalretail.com / ViewerPass123

## User Roles & Permissions

### Tenant Admin
- Full access to all features
- Can manage users, roles, and permissions
- Can access all modules with full CRUD operations

### Tenant Manager
- Limited management access
- Can manage users and content
- Can create reports and analytics
- View-only access to roles and settings

### Tenant User
- Basic user access
- Can view most modules
- Can create content
- Limited editing capabilities

### Read-only User
- View-only access to all modules
- Cannot create, edit, or delete anything
- Perfect for auditors and viewers

## Available Modules

1. **Dashboard** - Overview and analytics
2. **User Management** - Manage tenant users
3. **Role & Permission Management** - Configure access rights
4. **Module Management** - Enable/disable features
5. **Reports & Analytics** - Generate reports
6. **Analytics** - Data insights
7. **Content Management** - Manage content
8. **Notifications** - System notifications
9. **Audit Logs** - Activity tracking
10. **Settings** - System configuration

## Troubleshooting

### Database Connection Issues
```bash
# Check database connection
npx prisma db push

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset
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

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper database credentials
- Set up email service for password resets

## Support

For issues and questions, please check the project documentation or create an issue in the repository. 