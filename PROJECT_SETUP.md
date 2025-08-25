# Multi-Tenant NextJS Admin Dashboard

A comprehensive multi-tenant admin dashboard built with Next.js 15, featuring role-based access control, real-time notifications, and a modular architecture.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-tenant-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/multi_tenant_db"
   
   # JWT Secret
   JWT_SECRET="your-super-secret-jwt-key-here"
   
   # Next.js
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # WebSocket
   WEBSOCKET_PORT=3001
   
   # Optional: Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
   CLERK_SECRET_KEY=""
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📊 Database Seeding

### Initial Data Setup

The application comes with comprehensive seeding scripts to set up the initial data structure:

#### 1. Basic Database Seeding
```bash
npm run db:seed
```
This creates:
- Default superadmin account
- Sample tenant (ACME Corp)
- Basic roles and permissions
- Sample modules

#### 2. Additional Seeding Options

**Seed Users Only:**
```bash
npm run db:seed-users
```

**Seed Audit Logs:**
```bash
npm run db:seed-audit-logs
```

**Seed Notifications:**
```bash
npm run db:seed-notifications
```

**Seed Support Tickets:**
```bash
npm run db:seed-support-tickets
```

**Seed Tenant Data:**
```bash
npm run db:seed-tenants
```

**Add Dynamic Data:**
```bash
npm run db:add-dynamic-data
```

### Default Credentials

After seeding, you can access the system with these default credentials:

#### SuperAdmin Access
- **URL:** `http://localhost:3000/superadmin/login`
- **Email:** `admin@example.com`
- **Password:** `admin123`

#### Tenant Access
- **URL:** `http://localhost:3000/acme/login`
- **Email:** `user@acme.com`
- **Password:** `password123`

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   │   ├── superadmin/    # SuperAdmin APIs
│   │   └── [tenantSlug]/  # Tenant-specific APIs
│   ├── superadmin/        # SuperAdmin pages
│   └── [tenantSlug]/      # Tenant pages
├── components/            # Reusable components
│   ├── header/           # Header components
│   ├── superadmin/       # SuperAdmin components
│   └── tenant/           # Tenant components
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication utilities
│   ├── api.ts           # API client
│   ├── socket.ts        # WebSocket client
│   └── websocket-server.js # WebSocket server
├── store/               # Redux store
├── context/             # React contexts
├── hooks/               # Custom hooks
├── services/            # API services
└── utils/               # Utility functions
```

## 🔐 Authentication & Authorization

### Multi-Tenant Architecture
- **SuperAdmin:** Full system access across all tenants
- **Tenant Users:** Access limited to their tenant's data
- **Role-Based Access:** Granular permissions per module

### Permission System
- **Module Permissions:** Read, Create, Update, Delete
- **Feature Permissions:** Specific feature access
- **Data Permissions:** Row-level security

## 📡 Real-Time Features

### WebSocket Integration
- Real-time notifications
- Live dashboard updates
- Instant status changes

### Notification System
- In-app notifications
- Email notifications (configurable)
- Toast notifications
- Notification history

## 🎨 UI/UX Features

### Design System
- **Tailwind CSS** for styling
- **Dark/Light Mode** support
- **Responsive Design** for all devices
- **Accessibility** compliant

### Components
- **DataTable** with sorting, filtering, pagination
- **Form Components** with validation
- **Modal System** for dialogs
- **Toast Notifications** for user feedback

## 🔧 Development Scripts

### Database Management
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed initial data
npm run db:reset       # Reset database
npm run db:verify      # Verify database state
```

### Testing
```bash
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
```

### Development
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
```

## 📚 API Documentation

### Swagger Integration
- **URL:** `http://localhost:3000/api/docs`
- Auto-generated API documentation
- Interactive API testing

### Postman Collection
- Import `docs/api/Multi-Tenant-NextJS-API.postman_collection.json`
- Pre-configured requests for all endpoints
- Environment variables for different tenants

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NEXTAUTH_SECRET="your-production-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL in .env.local
   - Ensure MySQL server is running
   - Check database permissions

2. **WebSocket Connection Issues**
   - Verify WEBSOCKET_PORT is available
   - Check firewall settings
   - Ensure WebSocket server is running

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser cache

### Logs
- Check browser console for client-side errors
- Check server logs for backend errors
- Use `npm run db:verify` to check database state

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section
