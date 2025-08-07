#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function generateTenantData() {
  console.log('🚀 Generating tenant data with various user types...');

  try {
    // Create permissions if they don't exist
    const permissions = [
      { name: 'tenant.read', description: 'Read tenant information', module: 'tenant', action: 'read' },
      { name: 'tenant.create', description: 'Create new tenants', module: 'tenant', action: 'create' },
      { name: 'tenant.update', description: 'Update tenant information', module: 'tenant', action: 'update' },
      { name: 'tenant.delete', description: 'Delete tenants', module: 'tenant', action: 'delete' },
      { name: 'user.read', description: 'Read user information', module: 'user', action: 'read' },
      { name: 'user.create', description: 'Create new users', module: 'user', action: 'create' },
      { name: 'user.update', description: 'Update user information', module: 'user', action: 'update' },
      { name: 'user.delete', description: 'Delete users', module: 'user', action: 'delete' },
      { name: 'audit.read', description: 'Read audit logs', module: 'audit', action: 'read' },
      { name: 'system.settings', description: 'Manage system settings', module: 'system', action: 'settings' },
      { name: 'reports.view', description: 'View reports and analytics', module: 'reports', action: 'view' },
      { name: 'data.export', description: 'Export data', module: 'data', action: 'export' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }

    // Create roles if they don't exist
    const roles = [
      { name: 'Super Admin', description: 'Full system access', isGlobal: true },
      { name: 'Tenant Admin', description: 'Tenant-level administration', isGlobal: false },
      { name: 'Manager', description: 'Team management access', isGlobal: false },
      { name: 'User', description: 'Standard user access', isGlobal: false },
      { name: 'Viewer', description: 'Read-only access', isGlobal: false },
      { name: 'Analyst', description: 'Data analysis and reporting', isGlobal: false },
      { name: 'Support', description: 'Customer support access', isGlobal: false }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
    }

    // Create 2 new tenants with comprehensive data
    const tenants = [
      {
        name: 'InnovateTech Solutions',
        slug: 'innovatetech',
        domain: 'innovatetech.com',
        description: 'Cutting-edge technology solutions for modern businesses',
        plan: 'enterprise',
        region: 'US East',
        features: ['analytics', 'api', 'sso', 'backup', 'ml', 'ai'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      },
      {
        name: 'Global Dynamics Corp',
        slug: 'globaldynamics',
        domain: 'globaldynamics.com',
        description: 'International business solutions and consulting',
        plan: 'professional',
        region: 'EU West',
        features: ['analytics', 'api', 'sso', 'backup'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    ];

    const createdTenants = [];
    for (const tenantData of tenants) {
      // Check if tenant already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: tenantData.slug }
      });

      if (existingTenant) {
        console.log(`ℹ️ Tenant ${tenantData.name} already exists, skipping...`);
        createdTenants.push(existingTenant);
        continue;
      }

      const tenant = await prisma.tenant.create({
        data: {
          ...tenantData,
          features: tenantData.features as any
        }
      });

      createdTenants.push(tenant);
      console.log(`✅ Created tenant: ${tenant.name}`);

      // Get roles for assignment
      const tenantAdminRole = await prisma.role.findUnique({ where: { name: 'Tenant Admin' } });
      const managerRole = await prisma.role.findUnique({ where: { name: 'Manager' } });
      const userRole = await prisma.role.findUnique({ where: { name: 'User' } });
      const viewerRole = await prisma.role.findUnique({ where: { name: 'Viewer' } });
      const analystRole = await prisma.role.findUnique({ where: { name: 'Analyst' } });
      const supportRole = await prisma.role.findUnique({ where: { name: 'Support' } });

      // Create users for each tenant with different roles
      const usersData = [
        // InnovateTech Solutions users
        ...(tenant.slug === 'innovatetech' ? [
          { email: 'admin@innovatetech.com', name: 'Sarah Johnson', role: tenantAdminRole, password: 'admin123', createdAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000) },
          { email: 'ceo@innovatetech.com', name: 'Michael Chen', role: tenantAdminRole, password: 'admin123', createdAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000) },
          { email: 'tech.manager@innovatetech.com', name: 'David Rodriguez', role: managerRole, password: 'user123', createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
          { email: 'product.manager@innovatetech.com', name: 'Emily Watson', role: managerRole, password: 'user123', createdAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000) },
          { email: 'senior.dev@innovatetech.com', name: 'Alex Thompson', role: userRole, password: 'user123', createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
          { email: 'junior.dev@innovatetech.com', name: 'Jessica Lee', role: userRole, password: 'user123', createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000) },
          { email: 'ui.ux@innovatetech.com', name: 'Ryan Park', role: userRole, password: 'user123', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          { email: 'data.analyst@innovatetech.com', name: 'Lisa Garcia', role: analystRole, password: 'user123', createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
          { email: 'ml.engineer@innovatetech.com', name: 'Kevin Zhang', role: analystRole, password: 'user123', createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
          { email: 'support.lead@innovatetech.com', name: 'Maria Santos', role: supportRole, password: 'user123', createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },
          { email: 'support.agent@innovatetech.com', name: 'James Wilson', role: supportRole, password: 'user123', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
          { email: 'intern@innovatetech.com', name: 'Sophie Brown', role: viewerRole, password: 'user123', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
          { email: 'consultant@innovatetech.com', name: 'Robert Taylor', role: viewerRole, password: 'user123', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
        ] : []),
        
        // Global Dynamics Corp users
        ...(tenant.slug === 'globaldynamics' ? [
          { email: 'admin@globaldynamics.com', name: 'Jennifer Adams', role: tenantAdminRole, password: 'admin123', createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
          { email: 'director@globaldynamics.com', name: 'Christopher Miller', role: tenantAdminRole, password: 'admin123', createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
          { email: 'operations.manager@globaldynamics.com', name: 'Amanda White', role: managerRole, password: 'user123', createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
          { email: 'sales.manager@globaldynamics.com', name: 'Daniel Clark', role: managerRole, password: 'user123', createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000) },
          { email: 'marketing.manager@globaldynamics.com', name: 'Rachel Green', role: managerRole, password: 'user123', createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
          { email: 'senior.consultant@globaldynamics.com', name: 'Thomas Anderson', role: userRole, password: 'user123', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
          { email: 'consultant@globaldynamics.com', name: 'Nicole Martinez', role: userRole, password: 'user123', createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
          { email: 'junior.consultant@globaldynamics.com', name: 'Andrew Johnson', role: userRole, password: 'user123', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
          { email: 'business.analyst@globaldynamics.com', name: 'Stephanie Davis', role: analystRole, password: 'user123', createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
          { email: 'financial.analyst@globaldynamics.com', name: 'Brandon Wilson', role: analystRole, password: 'user123', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
          { email: 'customer.success@globaldynamics.com', name: 'Lauren Thompson', role: supportRole, password: 'user123', createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
          { email: 'support.specialist@globaldynamics.com', name: 'Eric Brown', role: supportRole, password: 'user123', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { email: 'assistant@globaldynamics.com', name: 'Michelle Lee', role: viewerRole, password: 'user123', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { email: 'partner@globaldynamics.com', name: 'Jonathan Smith', role: viewerRole, password: 'user123', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        ] : [])
      ];

      // Create users for this tenant
      for (const userData of usersData) {
        const hashedPassword = await hashPassword(userData.password);
        
        await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            tenantId: tenant.id,
            roleId: userData.role?.id,
            createdAt: userData.createdAt,
            isActive: true
          }
        });
      }

      console.log(`✅ Created ${usersData.length} users for ${tenant.name}`);
    }

    // Create sample audit logs for the new tenants
    const auditLogs = [
      // InnovateTech audit logs
      { action: 'tenant.create', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000) },
      { action: 'user.create', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
      { action: 'user.update', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'innovatetech', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      
      // Global Dynamics audit logs
      { action: 'tenant.create', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },
      { action: 'user.create', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
      { action: 'user.update', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'globaldynamics', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
    ];

    for (const logData of auditLogs) {
      const tenant = createdTenants.find(t => t.slug === logData.tenantSlug);
      const user = tenant ? await prisma.user.findFirst({ where: { tenantId: tenant.id } }) : null;

      await prisma.auditLog.create({
        data: {
          action: logData.action,
          details: { description: `Sample audit log for ${logData.action} in ${logData.tenantSlug}` },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: tenant?.id,
          userId: user?.id,
          createdAt: logData.createdAt
        }
      });
    }

    console.log('✅ Sample audit logs created');

    // Create sample support tickets
    const supportTickets = [
      { subject: 'API Integration Issue', description: 'Having trouble with API authentication', status: 'open', priority: 'high', tenantSlug: 'innovatetech' },
      { subject: 'Dashboard Performance', description: 'Dashboard loading slowly', status: 'in_progress', priority: 'medium', tenantSlug: 'innovatetech' },
      { subject: 'User Permission Request', description: 'Need access to analytics module', status: 'resolved', priority: 'low', tenantSlug: 'innovatetech' },
      { subject: 'Data Export Problem', description: 'Cannot export large datasets', status: 'open', priority: 'high', tenantSlug: 'globaldynamics' },
      { subject: 'Feature Request', description: 'Request for advanced reporting features', status: 'open', priority: 'medium', tenantSlug: 'globaldynamics' },
      { subject: 'Login Issue Resolved', description: 'SSO login working now', status: 'closed', priority: 'low', tenantSlug: 'globaldynamics' }
    ];

    for (const ticketData of supportTickets) {
      const tenant = createdTenants.find(t => t.slug === ticketData.tenantSlug);
      const user = tenant ? await prisma.user.findFirst({ where: { tenantId: tenant.id } }) : null;

      await prisma.supportTicket.create({
        data: {
          subject: ticketData.subject,
          description: ticketData.description,
          status: ticketData.status,
          priority: ticketData.priority,
          tenantId: tenant?.id,
          userId: user?.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        }
      });
    }

    console.log('✅ Sample support tickets created');

    console.log('');
    console.log('🎉 Tenant data generation completed successfully!');
    console.log('');
    console.log('📊 Generated Data Summary:');
    console.log('├── 2 New Tenants:');
    console.log('│   ├── InnovateTech Solutions (Enterprise Plan)');
    console.log('│   └── Global Dynamics Corp (Professional Plan)');
    console.log('├── 28 Users across different roles:');
    console.log('│   ├── Tenant Admins (4 users)');
    console.log('│   ├── Managers (5 users)');
    console.log('│   ├── Regular Users (6 users)');
    console.log('│   ├── Analysts (4 users)');
    console.log('│   ├── Support Staff (4 users)');
    console.log('│   └── Viewers (5 users)');
    console.log('├── 20 Audit Logs');
    console.log('└── 6 Support Tickets');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('├── InnovateTech Admin: admin@innovatetech.com / admin123');
    console.log('├── Global Dynamics Admin: admin@globaldynamics.com / admin123');
    console.log('└── All other users: [email] / user123');
    console.log('');

  } catch (error) {
    console.error('❌ Error generating tenant data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateTenantData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 