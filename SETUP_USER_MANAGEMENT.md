# Quick Setup Guide - User Management System

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed-users
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the System
Navigate to: `http://localhost:3000/superadmin/users`

## 📊 Sample Data

The seeding script creates:
- **4 Roles**: Tenant Admin, User, Viewer, Manager
- **5 Tenants**: TechCorp, Global Innovations, DataFlow, CloudTech, Innovate Labs
- **15+ Users**: Across different tenants with various roles and statuses

### Test Users
- **John Doe** (john.doe@techcorp.com) - TechCorp Admin
- **Jane Smith** (jane.smith@techcorp.com) - TechCorp Manager
- **Mike Johnson** (mike.johnson@global.com) - Global Innovations Admin
- **Emma Garcia** (emma.garcia@dataflow.com) - DataFlow Admin

## 🎯 Features to Test

### ✅ Pagination & Sorting
- Change page size (10, 25, 50, 100)
- Sort by Name, Email, Created Date, Status
- Navigate through pages

### ✅ Search & Filters
- Search by name or email
- Filter by Tenant (dropdown)
- Filter by Role (dropdown)
- Filter by Status (Active/Inactive)
- Clear all filters

### ✅ User Actions
- View user details (console log)
- Edit user (console log)
- Toggle user status (Active/Inactive)
- Reset password (generates new temp password)
- Delete user (with confirmation)

### ✅ Export
- Export filtered data to CSV
- Download includes all user information

### ✅ Error Handling
- Network errors show retry option
- Invalid filters show error messages
- Loading states for all actions

## 🔧 Environment Variables

Create `.env.local` file:
```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

## 🐛 Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   npm install
   npm run db:generate
   ```

2. **Database connection errors**
   - Check DATABASE_URL in .env
   - Ensure MySQL is running
   - Run `npm run db:push`

3. **No data showing**
   - Run `npm run db:seed-users`
   - Check browser console for errors
   - Verify API endpoints are working

4. **Authentication errors**
   - Ensure you're logged in as superadmin
   - Check JWT_SECRET in .env
   - Clear browser cache

### Debug Mode
Set `NODE_ENV=development` to see detailed logs in console.

## 📱 Responsive Testing

Test on different screen sizes:
- **Desktop**: Full table with all columns
- **Tablet**: Responsive table with horizontal scroll
- **Mobile**: Stacked layout with action buttons

## 🎨 Dark Mode

Toggle dark mode to test theme consistency across all components.

## 📈 Performance

- **Initial Load**: Should be under 2 seconds
- **Search**: Debounced (500ms delay)
- **Pagination**: Instant navigation
- **Export**: Should start download immediately

## 🔒 Security Testing

- Try accessing without authentication (should redirect to login)
- Test with invalid tokens
- Verify audit logs are created for all actions

---

**Need Help?** Check the full documentation in `USER_MANAGEMENT_IMPLEMENTATION.md` 