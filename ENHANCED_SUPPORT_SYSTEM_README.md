# Enhanced Support Ticket System

## Overview

The Enhanced Support Ticket System is a comprehensive, multi-tenant support management solution built with Next.js, TypeScript, and Tailwind CSS. It provides a modern, user-friendly interface for creating, managing, and tracking support tickets with advanced features like file uploads, real-time replies, and granular permission controls.

## Features

### 🎯 Core Features

- **Multi-tenant Support**: Isolated support ticket management per tenant
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Permission-based Access**: Granular permission controls for all operations
- **Real-time Updates**: Live ticket status and reply updates
- **File Attachments**: Drag-and-drop file upload with progress tracking
- **Rich Text Replies**: Support for formatted replies with quote functionality
- **Advanced Filtering**: Search, filter, and sort tickets by multiple criteria
- **Bulk Operations**: Select and perform actions on multiple tickets
- **Responsive Design**: Mobile-friendly interface with dark mode support

### 🔐 Permission System

The system implements a comprehensive permission-based access control:

- **support:create** - Create new support tickets
- **support:read** - View support tickets
- **support:update** - Edit tickets and add replies
- **support:delete** - Delete support tickets
- **support:viewAll** - View all tickets (admin functionality)

### 📁 File Management

- **Drag & Drop Upload**: Intuitive file upload interface
- **Multiple File Types**: Support for images, documents, PDFs, and archives
- **Progress Tracking**: Real-time upload progress indicators
- **File Preview**: Image previews and file type icons
- **Size Limits**: Configurable file size limits (default: 10MB per file)
- **Download Support**: Secure file download functionality

### 💬 Reply System

- **Threaded Conversations**: Organized reply threads
- **Quote Replies**: Quote previous messages in replies
- **Attachment Support**: Add files to replies
- **User/Admin Distinction**: Clear identification of user vs admin replies
- **Real-time Updates**: Instant reply notifications

### 🎨 User Interface

- **Modern Design**: Clean, professional interface using Tailwind CSS
- **Dark Mode**: Full dark mode support
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Loading States**: Smooth loading animations and skeleton screens
- **Error Handling**: Comprehensive error messages and recovery options
- **Accessibility**: WCAG compliant with keyboard navigation support

## Components

### Enhanced Components

1. **EnhancedTicketList** (`src/components/support-tickets/EnhancedTicketList.tsx`)
   - Advanced filtering and search
   - Bulk selection and operations
   - Sortable columns
   - Pagination support
   - Permission-based actions

2. **EnhancedTicketDetails** (`src/components/support-tickets/EnhancedTicketDetails.tsx`)
   - Rich ticket information display
   - Threaded reply system
   - File attachment management
   - Quote reply functionality
   - Quick actions sidebar

3. **EnhancedTicketForm** (`src/components/support-tickets/EnhancedTicketForm.tsx`)
   - Comprehensive form validation
   - File upload integration
   - Helpful tips and guides
   - Permission checks
   - Auto-save functionality

4. **EnhancedAttachmentUploader** (`src/components/support-tickets/EnhancedAttachmentUploader.tsx`)
   - Drag-and-drop interface
   - Progress tracking
   - File type validation
   - Preview functionality
   - Error handling

### UI Components

The system includes a complete set of reusable UI components:

- **Card** - Container components with header and content areas
- **Button** - Various button styles and states
- **Input/Textarea** - Form input components
- **Select** - Dropdown selection components
- **Badge** - Status and category indicators
- **Avatar** - User profile images
- **Tooltip** - Helpful hover information
- **DropdownMenu** - Context menus
- **Alert** - Notification and error messages
- **Progress** - Upload progress indicators
- **DataTable** - Tabular data display with pagination

## Database Schema

The system uses a comprehensive database schema with the following tables:

```sql
-- Support Tickets
CREATE TABLE support_tickets (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(50) DEFAULT 'general',
  tenantId VARCHAR(255),
  userId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Support Ticket Comments/Replies
CREATE TABLE support_ticket_comments (
  id VARCHAR(255) PRIMARY KEY,
  ticketId VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  commentedBy VARCHAR(255) NOT NULL,
  commenterType VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Support Ticket Attachments
CREATE TABLE support_ticket_attachments (
  id VARCHAR(255) PRIMARY KEY,
  ticketId VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  path VARCHAR(500) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Ticket Comment Attachments
CREATE TABLE support_ticket_comment_attachments (
  id VARCHAR(255) PRIMARY KEY,
  commentId VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  path VARCHAR(500) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Tenant Support Endpoints

- `GET /api/tenant/[tenantSlug]/support` - List support tickets
- `POST /api/tenant/[tenantSlug]/support` - Create new ticket
- `GET /api/tenant/[tenantSlug]/support/[id]` - Get ticket details
- `PUT /api/tenant/[tenantSlug]/support/[id]` - Update ticket
- `DELETE /api/tenant/[tenantSlug]/support/[id]` - Delete ticket
- `POST /api/tenant/[tenantSlug]/support/[id]/comments` - Add reply
- `POST /api/tenant/[tenantSlug]/support/upload` - Upload file
- `GET /api/tenant/[tenantSlug]/support/attachments/[id]/download` - Download file

## Usage Examples

### Creating a New Ticket

```typescript
import { useCreateSupportTicket } from '@/hooks/useSupportTickets';

const createTicket = useCreateSupportTicket();

const handleSubmit = async (data: CreateTicketData) => {
  try {
    const result = await createTicket.mutateAsync(data);
    console.log('Ticket created:', result.ticket);
  } catch (error) {
    console.error('Failed to create ticket:', error);
  }
};
```

### Adding a Reply

```typescript
import { useAddReply } from '@/hooks/useSupportTickets';

const addReply = useAddReply();

const handleReply = async (ticketId: string, replyData: ReplyData) => {
  try {
    const result = await addReply.mutateAsync({ id: ticketId, data: replyData });
    console.log('Reply added:', result.comment);
  } catch (error) {
    console.error('Failed to add reply:', error);
  }
};
```

### Uploading Files

```typescript
import { useUploadAttachment } from '@/hooks/useSupportTickets';

const uploadFile = useUploadAttachment();

const handleFileUpload = async (file: File) => {
  try {
    const result = await uploadFile.mutateAsync(file);
    console.log('File uploaded:', result);
  } catch (error) {
    console.error('Failed to upload file:', error);
  }
};
```

## Configuration

### Environment Variables

```env
# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=image/*,application/pdf,application/msword,text/plain
UPLOAD_DIR=./uploads

# Database Configuration
DATABASE_URL=your_database_url_here

# Authentication
JWT_SECRET=your_jwt_secret_here
```

### Permission Configuration

Permissions are managed through the role-based access control system:

```typescript
// Example permission configuration
const supportPermissions = {
  create: 'support:create',
  read: 'support:read',
  update: 'support:update',
  delete: 'support:delete',
  viewAll: 'support:viewAll'
};
```

## Security Features

- **Tenant Isolation**: Complete data separation between tenants
- **Permission Validation**: Server-side permission checks on all endpoints
- **File Upload Security**: File type and size validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization and output encoding
- **CSRF Protection**: Token-based request validation

## Performance Optimizations

- **Query Optimization**: Efficient database queries with proper indexing
- **Caching**: React Query for client-side caching
- **Lazy Loading**: Component and route-based code splitting
- **Image Optimization**: Next.js Image component for optimized images
- **Debounced Search**: Reduced API calls with search debouncing

## Testing

The system includes comprehensive testing:

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing
- **Permission Tests**: Access control validation

## Deployment

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions about the Enhanced Support Ticket System, please:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Note**: This enhanced support ticket system is designed to be scalable, secure, and user-friendly while maintaining high performance and reliability in multi-tenant environments.
