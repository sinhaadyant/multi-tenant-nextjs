import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSupportTicketsAPI() {
  console.log('🧪 Testing SuperAdmin Support Tickets API...\n');

  try {
    // Test 1: Check if there are any support tickets in the database
    const tickets = await prisma.supportTicket.findMany({
      take: 5,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
        attachments: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log('📊 Current Support Tickets in Database:');
    console.log(`Total tickets found: ${tickets.length}\n`);

    if (tickets.length > 0) {
      tickets.forEach((ticket, index) => {
        console.log(`Ticket ${index + 1}:`);
        console.log(`  ID: ${ticket.id}`);
        console.log(`  Title: ${ticket.title}`);
        console.log(`  Status: ${ticket.status}`);
        console.log(`  Priority: ${ticket.priority}`);
        console.log(`  Category: ${ticket.category}`);
        console.log(`  Comments: ${ticket.comments.length}`);
        console.log(`  Attachments: ${ticket.attachments.length}`);
        console.log(`  Tenant: ${ticket.tenant?.name || 'N/A'}`);
        console.log(`  User: ${ticket.user?.name || 'N/A'}`);
        console.log('');
      });
    }

    // Test 2: Check if there are any comments
    const comments = await prisma.supportTicketComment.findMany({
      take: 5,
      include: {
        attachments: true,
      },
    });

    console.log('💬 Current Comments in Database:');
    console.log(`Total comments found: ${comments.length}\n`);

    if (comments.length > 0) {
      comments.forEach((comment, index) => {
        console.log(`Comment ${index + 1}:`);
        console.log(`  ID: ${comment.id}`);
        console.log(`  Text: ${comment.text.substring(0, 50)}...`);
        console.log(`  Commenter Type: ${comment.commenterType}`);
        console.log(`  Attachments: ${comment.attachments.length}`);
        console.log('');
      });
    }

    // Test 3: Check database schema
    console.log('🗄️ Database Schema Check:');
    
    const ticketCount = await prisma.supportTicket.count();
    const commentCount = await prisma.supportTicketComment.count();
    const attachmentCount = await prisma.supportTicketAttachment.count();
    
    console.log(`Support Tickets: ${ticketCount}`);
    console.log(`Comments: ${commentCount}`);
    console.log(`Attachments: ${attachmentCount}\n`);

    console.log('✅ Support Tickets API test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Support Tickets API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSupportTicketsAPI();
