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
  },
  {
    title: 'Billing Invoice Discrepancy',
    description: 'There appears to be a discrepancy in our monthly billing invoice. We were charged for features we don\'t have access to, and some of our actual usage is not reflected correctly. Need clarification on the billing breakdown.',
    category: 'billing',
    priority: 'medium',
    status: 'in_progress',
    isForwarded: true,
  },
  {
    title: 'API Rate Limiting Questions',
    description: 'We\'re approaching our API rate limits and need to understand the upgrade process. Also, we\'d like to know if there are any bulk operations available to reduce our API calls.',
    category: 'technical',
    priority: 'low',
    status: 'open',
    isForwarded: false,
  },
  {
    title: 'Data Export Feature Request',
    description: 'We need the ability to export our data in CSV format for reporting purposes. Currently, we can only view data in the dashboard but cannot download it for external analysis.',
    category: 'general',
    priority: 'medium',
    status: 'resolved',
    isForwarded: false,
  },
  {
    title: 'User Permission Configuration',
    description: 'We need help setting up role-based permissions for our team. Some users need read-only access while others need full administrative privileges. The current permission system seems too restrictive.',
    category: 'technical',
    priority: 'high',
    status: 'in_progress',
    isForwarded: true,
  },
  {
    title: 'Performance Issues with Dashboard',
    description: 'The dashboard is loading very slowly, especially when viewing analytics data. Page load times have increased from 2-3 seconds to 15-20 seconds over the past week.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    isForwarded: false,
  },
  {
    title: 'Contract Renewal Questions',
    description: 'Our contract is up for renewal next month and we have some questions about the new pricing structure. We\'d also like to discuss potential volume discounts for our growing team.',
    category: 'billing',
    priority: 'medium',
    status: 'open',
    isForwarded: false,
  },
  {
    title: 'Integration with Third-party Tools',
    description: 'We\'re looking to integrate with Slack and Microsoft Teams for notifications. Is there an API available for this, or do you have built-in integrations we can configure?',
    category: 'technical',
    priority: 'low',
    status: 'resolved',
    isForwarded: false,
  },
];

const sampleComments = [
  {
    text: 'Thank you for reporting this issue. We\'re investigating the SSO login problems and will provide an update within 24 hours.',
    commenterType: 'superadmin' as const,
  },
  {
    text: 'We\'ve identified the root cause of the billing discrepancy. A refund will be processed within 3-5 business days.',
    commenterType: 'superadmin' as const,
  },
  {
    text: 'The API rate limiting documentation has been updated. You can find the upgrade process in our developer portal.',
    commenterType: 'superadmin' as const,
  },
  {
    text: 'CSV export functionality has been implemented and is now available in your dashboard.',
    commenterType: 'superadmin' as const,
  },
  {
    text: 'We\'re working on a new permission system that will provide more granular control. Expected release date is next month.',
    commenterType: 'superadmin' as const,
  },
];

async function seedSupportTickets() {
  try {
    console.log('🌱 Seeding support tickets...');

    // Get some existing tenants and users for realistic data
    const tenants = await prisma.tenant.findMany({ take: 3 });
    const users = await prisma.user.findMany({ take: 2 });

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
        },
      });

      console.log(`✅ Created ticket: ${ticket.title}`);

      // Add some comments to tickets
      if (i < sampleComments.length) {
        const comment = await prisma.supportTicketComment.create({
          data: {
            text: sampleComments[i].text,
            ticketId: ticket.id,
            commentedBy: 'superadmin-seed', // This would be a real superadmin ID in production
            commenterType: sampleComments[i].commenterType,
          },
        });

        console.log(`💬 Added comment to ticket: ${ticket.title}`);
      }
    }

    console.log('✅ Support tickets seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding support tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedSupportTickets(); 