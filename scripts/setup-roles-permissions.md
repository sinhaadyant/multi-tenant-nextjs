# 🚀 Quick Setup Guide - Roles & Permissions Module

## 📋 Prerequisites

- Node.js 18+ installed
- Database (MySQL) running
- Environment variables configured

## ⚡ Quick Start

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Setup Database**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data
npx tsx scripts/seed-permissions-roles.ts
```

### 3. **Start Development Server**
```bash
npm run dev
```

### 4. **Access the Module**
Navigate to: `http://localhost:3000/superadmin/roles`

## 🧪 Testing

### **Run Component Tests**
```bash
npx tsx scripts/test-roles-permissions-api.ts
```

### **Manual Testing Checklist**
- [ ] Navigate to Roles & Permissions in sidebar
- [ ] Test Roles Management tab
- [ ] Test Permission Groups tab
- [ ] Test Role Assignment tab
- [ ] Create a new role
- [ ] Edit an existing role
- [ ] Delete a role (with confirmation)
- [ ] Assign roles to users
- [ ] Search and filter functionality
- [ ] Pagination (if many records)

## 📊 Initial Data

The seeding script creates:

### **Permissions (28 total)**
- **Users Module**: 5 permissions
- **Tenants Module**: 5 permissions
- **Roles Module**: 5 permissions
- **Permissions Module**: 4 permissions
- **Audit Module**: 2 permissions
- **Notifications Module**: 3 permissions
- **Dashboard Module**: 2 permissions
- **Settings Module**: 2 permissions

### **Roles (4 total)**
1. **Super Administrator** - Full system access (28 permissions)
2. **Tenant Administrator** - Tenant management (16 permissions)
3. **User Manager** - User management (8 permissions)
4. **Viewer** - Read-only access (5 permissions)

## 🔧 Configuration

### **Environment Variables**
```env
DATABASE_URL="mysql://user:password@localhost:3306/database"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### **Database Schema**
The module uses these tables:
- `roles` - Role definitions
- `permissions` - Permission definitions
- `role_permissions` - Role-permission relationships
- `users` - User accounts (with roleId field)

## 🛠️ Troubleshooting

### **Common Issues**

1. **"Module not found" errors**
   ```bash
   npm install
   npx prisma generate
   ```

2. **Database connection issues**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **API endpoints not working**
   - Check if development server is running
   - Verify authentication is working
   - Check browser console for errors

4. **Components not loading**
   - Clear browser cache
   - Check for TypeScript errors
   - Verify all imports are correct

### **Debug Mode**
Enable debug logging:
```bash
NODE_ENV=development npm run dev
```

## 📚 Documentation

- **Full Implementation Guide**: `ROLES_PERMISSIONS_IMPLEMENTATION.md`
- **API Documentation**: Check individual route files
- **Component Documentation**: Check individual component files

## 🎯 Next Steps

1. **Test all functionality** thoroughly
2. **Customize permissions** as needed
3. **Add role assignments** to existing users
4. **Configure audit logging** settings
5. **Set up monitoring** and alerts

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the full implementation documentation
3. Check the browser console for errors
4. Verify database connections and data

---

**🎉 The Roles & Permissions Module is now ready for use!** 