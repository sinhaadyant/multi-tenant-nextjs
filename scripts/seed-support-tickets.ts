import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTickets = [
  {
    title: 'Login Issues with SSO',
    description: 'Users are experiencing intermittent login failures when using Single Sign-On. The issue seems to occur during peak hours and affects about 30% of our users. We\'ve tried clearing browser cache and cookies, but the problem persists.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    isForwarded: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    title: 'Billing Invoice Discrepancy',
    description: 'There appears to be a discrepancy in our monthly billing invoice. We were charged for features we don\'t have access to, and some of our actual usage is not reflected correctly. Need clarification on the billing breakdown.',
    category: 'billing',
    priority: 'medium',
    status: 'in_progress',
    isForwarded: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    title: 'API Rate Limiting Questions',
    description: 'We\'re approaching our API rate limits and need to understand the upgrade process. Also, we\'d like to know if there are any bulk operations available to reduce our API calls.',
    category: 'technical',
    priority: 'low',
    status: 'open',
    isForwarded: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    title: 'Data Export Feature Request',
    description: 'We need the ability to export our data in CSV format for reporting purposes. Currently, we can only view data in the dashboard but cannot download it for external analysis.',
    category: 'general',
    priority: 'medium',
    status: 'resolved',
    isForwarded: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  },
  {
    title: 'User Permission Configuration',
    description: 'We need help setting up role-based permissions for our team. Some users need read-only access while others need full administrative privileges. The current permission system seems too restrictive.',
    category: 'technical',
    priority: 'high',
    status: 'in_progress',
    isForwarded: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    title: 'Performance Issues with Dashboard',
    description: 'The dashboard is loading very slowly, especially when viewing analytics data. Page load times have increased from 2-3 seconds to 15-20 seconds over the past week.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    isForwarded: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
  },
  {
    title: 'Contract Renewal Questions',
    description: 'Our contract is up for renewal next month and we have some questions about the new pricing structure. We\'d also like to discuss potential volume discounts for our growing team.',
    category: 'billing',
    priority: 'medium',
    status: 'open',
    isForwarded: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
  {
    title: 'Integration with Third-party Tools',
    description: 'We\'re looking to integrate with Slack and Microsoft Teams for notifications. Is there an API available for this, or do you have built-in integrations we can configure?',
    category: 'technical',
    priority: 'low',
    status: 'resolved',
    isForwarded: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
  },
  {
    title: 'Mobile App Notifications',
    description: 'Push notifications are not working on our mobile app. Users are not receiving alerts for important updates and messages.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    isForwarded: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    title: 'Data Backup Request',
    description: 'We need to schedule a full data backup for compliance purposes. Can you help us set up automated daily backups?',
    category: 'general',
    priority: 'medium',
    status: 'in_progress',
    isForwarded: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
  },
  {
    title: 'User Account Locked',
    description: 'My account has been locked due to multiple failed login attempts. I need help unlocking it as I have important work to complete.',
    category: 'account',
    priority: 'high',
    status: 'resolved',
    isForwarded: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
  },
  {
    title: 'Feature Request: Dark Mode',
    description: 'We would love to have a dark mode option for the dashboard. Many of our users work in low-light environments and this would greatly improve their experience.',
    category: 'general',
    priority: 'low',
    status: 'open',
    isForwarded: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
  },
  {
    title: 'Report Generation Error',
    description: 'When trying to generate monthly reports, we\'re getting an error message. The process starts but fails after about 5 minutes with a timeout error.',
    category: 'technical',
    priority: 'medium',
    status: 'in_progress',
    isForwarded: true,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
  },
  {
    title: 'Training Session Request',
    description: 'We have 5 new team members who need training on the platform. Can you schedule a training session for next week?',
    category: 'general',
    priority: 'low',
    status: 'open',
    isForwarded: false,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
  },
  {
    title: 'Security Audit Questions',
    description: 'We\'re conducting our annual security audit and need documentation about your security practices and compliance certifications.',
    category: 'security',
    priority: 'medium',
    status: 'resolved',
    isForwarded: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
  },
];

const sampleComments = [
  {
    text: 'Thank you for reporting this issue. We\'re investigating the SSO login problems and will provide an update within 24 hours.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 days ago + 2 hours
  },
  {
    text: 'We\'ve identified the root cause of the billing discrepancy. A refund will be processed within 3-5 business days.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 5 days ago + 4 hours
  },
  {
    text: 'The API rate limiting documentation has been updated. You can find the upgrade process in our developer portal.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 day ago + 1 hour
  },
  {
    text: 'CSV export functionality has been implemented and is now available in your dashboard.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 10 days ago + 6 hours
  },
  {
    text: 'We\'re working on a new permission system that will provide more granular control. Expected release date is next month.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 days ago + 3 hours
  },
  {
    text: 'Our engineering team is investigating the performance issues. We\'ve identified a potential bottleneck in the analytics queries.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 4 days ago + 2 hours
  },
  {
    text: 'I\'ve scheduled a call with our sales team to discuss your contract renewal and pricing options.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 7 days ago + 5 hours
  },
  {
    text: 'The Slack and Teams integrations are now available. You can configure them in your notification settings.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 15 days ago + 8 hours
  },
  {
    text: 'We\'re investigating the mobile notification issue. This appears to be related to recent changes in our notification service.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 1 day ago + 30 minutes
  },
  {
    text: 'I\'ve set up automated daily backups for your account. You\'ll receive a confirmation email once the first backup is complete.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000), // 6 days ago + 7 hours
  },
  {
    text: 'Your account has been unlocked. Please use the password reset function to set a new password.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 8 days ago + 1 hour
  },
  {
    text: 'Dark mode is on our roadmap for Q2. We\'ll notify you when it becomes available.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 12 days ago + 2 hours
  },
  {
    text: 'The report generation timeout has been increased. Please try generating your report again.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 9 days ago + 4 hours
  },
  {
    text: 'I\'ve scheduled a training session for your team on Tuesday at 2 PM. You\'ll receive a calendar invite shortly.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 11 days ago + 3 hours
  },
  {
    text: 'I\'ve sent you our security documentation and compliance certificates via email.',
    commenterType: 'superadmin' as const,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 20 days ago + 9 hours
  },
];

async function seedSupportTickets() {
  try {
    console.log('🌱 Seeding support tickets...');

    // Get some existing tenants and users for realistic data
    const tenants = await prisma.tenant.findMany({ take: 5 });
    const users = await prisma.user.findMany({ take: 3 });

    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please seed tenants first.');
      return;
    }

    // Create support tickets
    for (let i = 0; i < sampleTickets.length; i++) {
      const ticketData = sampleTickets[i];
      const tenant = tenants[i % tenants.length];
      const user = users[i % users.length];

      const ticket = await prisma.supportTicket.create({
        data: {
          title: ticketData.title,
          description: ticketData.description,
          category: ticketData.category,
          priority: ticketData.priority,
          status: ticketData.status,
          isForwarded: ticketData.isForwarded,
          tenantId: tenant.id,
          userId: user?.id,
          createdAt: ticketData.createdAt,
        },
      });

      console.log(`✅ Created ticket: ${ticket.title}`);

      // Add comments to tickets
      if (i < sampleComments.length) {
        const comment = await prisma.supportTicketComment.create({
          data: {
            text: sampleComments[i].text,
            ticketId: ticket.id,
            commentedBy: 'superadmin-seed', // This would be a real superadmin ID in production
            commenterType: sampleComments[i].commenterType,
            createdAt: sampleComments[i].createdAt,
          },
        });

        console.log(`💬 Added comment to ticket: ${ticket.title}`);
      }

      // Add additional comments for some tickets to make them more realistic
      if (i % 3 === 0 && i < sampleComments.length) {
        const followUpComment = await prisma.supportTicketComment.create({
          data: {
            text: 'Thank you for the quick response. We\'ll test this and let you know if we encounter any issues.',
            ticketId: ticket.id,
            commentedBy: user?.id || 'user-seed',
            commenterType: 'user',
            createdAt: new Date(sampleComments[i].createdAt.getTime() + 2 * 60 * 60 * 1000), // 2 hours after first comment
          },
        });

        console.log(`💬 Added follow-up comment to ticket: ${ticket.title}`);
      }
    }

    console.log('✅ Support tickets seeded successfully!');
    console.log(`📊 Created ${sampleTickets.length} tickets with realistic timestamps and comments`);
  } catch (error) {
    console.error('❌ Error seeding support tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedSupportTickets(); 