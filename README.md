# Multi-Tenant Next.js Management Platform

A comprehensive multi-tenant management platform built with Next.js, featuring role-based access control, audit logs, and tenant isolation.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sinhaadyant/multi-tenant-nextjs.git
   cd multi-tenant-nextjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/multi_tenant_db"
   JWT_SECRET="your-jwt-secret-key"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**

   ```bash
   # Run database migrations
   npx prisma migrate dev

   # Seed the database with initial data
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 🔐 Login Credentials

### SuperAdmin Access

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

## 📁 Project Structure

```
multi-tenant-nextjs/
├── docs/                    # Documentation
│   ├── api/                # API documentation
│   ├── implementation/     # Implementation guides
│   ├── testing/           # Test documentation
│   └── database/          # Database schemas and exports
├── scripts/               # Utility scripts
│   ├── setup-scripts/     # Setup and configuration scripts
│   └── test-scripts/      # Testing scripts
├── config/                # Configuration files
├── src/                   # Source code
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   └── __tests__/        # Test files
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

## 🔧 Configuration

### Database

The application uses PostgreSQL with Prisma ORM. Database migrations are located in `prisma/migrations/`.

### Environment Variables

See `.env.example` for all required environment variables.

## 📚 Documentation

- [API Documentation](./docs/api/)
- [Implementation Guides](./docs/implementation/)
- [Installation Guide](./docs/INSTALLATION.md)
- [Testing Documentation](./docs/testing/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions, please refer to the documentation in the `docs/` folder or create an issue in the repository.
