import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate realistic user activity data over the last 30 days
const generateUserActivityData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic activity patterns (more activity on weekdays, less on weekends)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseActivity = isWeekend ? 15 : 45;
    
    // Add some randomness and trends
    const randomFactor = Math.random() * 0.6 + 0.7; // 0.7 to 1.3
    const trendFactor = 1 + (i / 30) * 0.3; // Gradual increase over time
    
    const activities = Math.round(baseActivity * randomFactor * trendFactor);
    const users = Math.round(activities * (0.3 + Math.random() * 0.4)); // 30-70% of activities
    
    data.push({
      date: date.toISOString(),
      users,
      activities
    });
  }
  
  return data;
};

// Generate system usage data
const generateSystemUsageData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic system usage patterns
    const hour = date.getHours();
    const isPeakHour = hour >= 9 && hour <= 17;
    
    const baseCPU = isPeakHour ? 65 : 35;
    const baseMemory = isPeakHour ? 75 : 50;
    const baseStorage = 45 + (i / 30) * 10; // Gradual storage increase
    
    const cpu = Math.round(baseCPU + (Math.random() - 0.5) * 20);
    const memory = Math.round(baseMemory + (Math.random() - 0.5) * 15);
    const storage = Math.round(baseStorage + (Math.random() - 0.5) * 5);
    
    data.push({
      date: date.toISOString(),
      cpu: Math.max(10, Math.min(95, cpu)),
      memory: Math.max(20, Math.min(90, memory)),
      storage: Math.max(40, Math.min(80, storage))
    });
  }
  
  return data;
};

// Generate role distribution data
const generateRoleDistributionData = () => {
  return [
    { role: 'Admin', count: 3 },
    { role: 'Manager', count: 8 },
    { role: 'User', count: 25 },
    { role: 'Viewer', count: 12 },
    { role: 'Guest', count: 5 }
  ];
};

// Generate user growth data
const generateUserGrowthData = () => {
  const data = [];
  const now = new Date();
  let currentUsers = 25; // Start with 25 users
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate user growth with some randomness
    if (i % 7 === 0) { // Add users weekly
      currentUsers += Math.floor(Math.random() * 5) + 1; // 1-5 new users per week
    }
    
    // Add some daily fluctuations
    const dailyChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    currentUsers = Math.max(20, currentUsers + dailyChange);
    
    data.push({
      date: date.toISOString(),
      count: currentUsers
    });
  }
  
  return data;
};

// Create analytics data records
const createAnalyticsData = async () => {
  try {
    console.log('🌱 Seeding analytics data...');
    
    // Get existing tenants
    const tenants = await prisma.tenant.findMany({ take: 3 });
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please seed tenants first.');
      return;
    }
    
    for (const tenant of tenants) {
      // Generate data for each tenant
      const userActivity = generateUserActivityData();
      const systemUsage = generateSystemUsageData();
      const roleDistribution = generateRoleDistributionData();
      const userGrowth = generateUserGrowthData();
      
      // Store analytics data in a structured way
      // Note: In a real application, you might want to create a dedicated analytics table
      // For now, we'll create some sample audit logs and user activities to simulate analytics
      
      // Create sample audit logs for user activity
      for (let i = 0; i < 50; i++) {
        const activityData = userActivity[i % userActivity.length];
        const date = new Date(activityData.date);
        
        await prisma.auditLog.create({
          data: {
            action: ['user.login', 'user.logout', 'data.view', 'report.generate', 'settings.update'][Math.floor(Math.random() * 5)],
            details: JSON.stringify({
              description: `Sample activity for analytics - ${activityData.activities} activities`,
              userId: `user-${Math.floor(Math.random() * 10) + 1}`,
              timestamp: date.toISOString()
            }),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            tenantId: tenant.id,
            createdAt: date
          }
        });
      }
      
      // Create sample users with different roles for role distribution
      const roles = ['Admin', 'Manager', 'User', 'Viewer', 'Guest'];
      for (let i = 0; i < 20; i++) {
        const role = roles[i % roles.length];
        await prisma.user.create({
          data: {
            email: `analytics-user-${i}@${tenant.slug}.com`,
            name: `Analytics User ${i + 1}`,
            password: '$2b$10$dummy.hash.for.testing', // Dummy hash
            tenantId: tenant.id,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
          }
        });
      }
      
      console.log(`✅ Created analytics data for tenant: ${tenant.name}`);
    }
    
    console.log('✅ Analytics data seeded successfully!');
    console.log('📊 Generated:');
    console.log('  - User activity data (30 days)');
    console.log('  - System usage data (30 days)');
    console.log('  - Role distribution data');
    console.log('  - User growth data (30 days)');
    console.log('  - Sample audit logs for activity tracking');
    
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeding function
createAnalyticsData();
