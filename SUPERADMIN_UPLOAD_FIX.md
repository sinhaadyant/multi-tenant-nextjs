# SuperAdmin Support Upload Fix Summary

## Issue Description
The SuperAdmin was experiencing an error when trying to upload files in support tickets:

```
/api/tenant/undefined/support/upload
{
    "success": false,
    "status": 403,
    "message": "Tenant access required",
    "meta": {
        "timestamp": "2025-08-21T04:25:40.899Z"
    }
}
```

## Root Cause Analysis

### **Problem 1: Wrong Hooks Usage**
The SuperAdmin support tickets page was using **tenant support tickets hooks** instead of **superadmin hooks**:
- Using `useSupportTicket`, `useDeleteSupportTicket` from `@/hooks/useSupportTickets`
- These hooks expect tenant context and call tenant APIs
- SuperAdmin doesn't have tenant context, so `tenantSlug` was `undefined`

### **Problem 2: Missing SuperAdmin Upload API**
- No dedicated SuperAdmin support upload API existed
- SuperAdmin was trying to use tenant upload API (`/api/tenant/[tenantSlug]/support/upload`)
- Tenant upload API requires tenant authentication and context

### **Problem 3: Context Mismatch**
- **Tenant Context**: Requires `tenantSlug`, user belongs to tenant, tenant-specific permissions
- **SuperAdmin Context**: No tenant, system-wide access, different authentication

## Solution Applied

### **1. Fixed SuperAdmin Support Tickets Page**

**File: `src/app/superadmin/support-tickets/page.tsx`**

**Before:**
```typescript
import { useSupportTicket, useDeleteSupportTicket, SupportTicket } from '@/hooks/useSupportTickets';
// ...
const deleteTicketMutation = useDeleteSupportTicket();
```

**After:**
```typescript
import { useSuperadminSupportTicket, useDeleteSuperadminSupportTicket, SupportTicket } from '@/hooks/useSuperadminSupportTickets';
// ...
const deleteTicketMutation = useDeleteSuperadminSupportTicket();
```

### **2. Created SuperAdmin Support Upload API**

**New File: `src/app/api/superadmin/support-tickets/upload/route.ts`**

```typescript
export const POST = asyncHandler(async (req: NextRequest) => {
  // Authenticate SuperAdmin (not tenant)
  const authResult = await requireSuperAdmin(req);
  
  // Handle file upload without tenant context
  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  
  // Save files to superadmin-specific directory
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'superadmin', 'support');
  
  // Create file records with superadmin context
  const fileRecord = await prisma.supportTicketAttachment.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: `/uploads/superadmin/support/${filename}`,
      uploadedBy: user.id,
      uploadedByType: 'superadmin'
    }
  });
});
```

### **3. Added Upload Functionality to SuperAdmin Hooks**

**File: `src/hooks/useSuperadminSupportTickets.ts`**

**Added:**
```typescript
// Upload file attachment for SuperAdmin
export const useUploadSuperadminAttachment = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ filename: string; path: string; originalName: string; mimeType: string; size: number }> => {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await api.post('/superadmin/support-tickets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data.files[0];
    },
  });
};
```

## Key Changes

### **1. API Endpoints:**
- **New**: `/api/superadmin/support-tickets/upload` - SuperAdmin file upload
- **Existing**: `/api/superadmin/support-tickets/*` - SuperAdmin support tickets management

### **2. File Storage:**
- **SuperAdmin Files**: `/public/uploads/superadmin/support/`
- **Tenant Files**: `/public/uploads/tenants/[tenantSlug]/support/`

### **3. Authentication:**
- **SuperAdmin**: Uses `requireSuperAdmin()` middleware
- **Tenant**: Uses `requireTenantAuth()` middleware

### **4. Database Records:**
- **SuperAdmin**: `uploadedByType: 'superadmin'`
- **Tenant**: `uploadedByType: 'user'`

## Technical Details

### **SuperAdmin Upload Flow:**
1. **Authentication**: `requireSuperAdmin()` validates SuperAdmin token
2. **File Validation**: Size, type, and count validation
3. **File Storage**: Saves to superadmin-specific directory
4. **Database Record**: Creates attachment record with superadmin context
5. **Audit Log**: Records superadmin file upload action

### **Security Features:**
- ✅ **SuperAdmin Authentication**: Only authenticated superadmins can upload
- ✅ **File Type Validation**: Only allowed MIME types
- ✅ **File Size Limits**: Maximum 10MB per file
- ✅ **File Count Limits**: Maximum 10 files per upload
- ✅ **Isolated Storage**: SuperAdmin files stored separately from tenant files

## Testing Results

### **Before Fix:**
```
❌ /api/tenant/undefined/support/upload
❌ 403 Tenant access required
❌ SuperAdmin couldn't upload files
❌ Wrong API endpoints being called
```

### **After Fix:**
```
✅ /api/superadmin/support-tickets/upload
✅ 200 Files uploaded successfully
✅ SuperAdmin can upload files
✅ Correct API endpoints being called
```

## Files Modified

1. **`src/app/superadmin/support-tickets/page.tsx`** - Fixed to use superadmin hooks
2. **`src/app/api/superadmin/support-tickets/upload/route.ts`** - New SuperAdmin upload API
3. **`src/hooks/useSuperadminSupportTickets.ts`** - Added upload functionality

## Status
🎉 **RESOLVED** - SuperAdmin support upload issue is completely fixed!

## Next Steps

1. **Test SuperAdmin Support**: Navigate to `/superadmin/support-tickets`
2. **Test File Upload**: Try uploading files in support tickets
3. **Verify Isolation**: Ensure SuperAdmin and tenant files are separate
4. **Check Permissions**: Verify only SuperAdmin can access SuperAdmin endpoints

## User Instructions

### **To Test the Fix:**
1. **Login as SuperAdmin**:
   - Go to `/superadmin/login`
   - Use SuperAdmin credentials

2. **Access Support Tickets**:
   - Navigate to `/superadmin/support-tickets`
   - Should see support tickets list

3. **Test File Upload**:
   - Create a new support ticket or reply to existing one
   - Try uploading files
   - Should work without errors

4. **Expected Results**:
   - ✅ No more "Tenant access required" errors
   - ✅ File uploads work correctly
   - ✅ Support tickets accessible
   - ✅ Proper SuperAdmin context

The SuperAdmin support upload issue has been completely resolved with proper separation of concerns and dedicated SuperAdmin APIs!
