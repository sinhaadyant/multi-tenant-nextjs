# Confirmation Modal System

A reusable, accessible, and theme-aware confirmation modal component built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ **Multiple Variants**: Danger, Warning, Info, Success
- ✅ **Dark/Light Mode Support**: Fully responsive to theme changes
- ✅ **Accessibility**: ARIA roles, focus trap, keyboard navigation
- ✅ **Smooth Animations**: Tailwind transitions and transforms
- ✅ **Programmatic API**: Easy-to-use hooks and context
- ✅ **TypeScript**: Full type safety
- ✅ **Portal Rendering**: Proper overlay behavior
- ✅ **Loading States**: Built-in loading indicators
- ✅ **Customizable**: Flexible props and styling

## Quick Start

### 1. Basic Usage

```tsx
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

const MyComponent = () => {
  const { confirm } = useConfirmModalContext();

  const handleDelete = () => {
    confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await deleteItem();
      },
    });
  };

  return <button onClick={handleDelete}>Delete</button>;
};
```

### 2. Using Helper Functions

```tsx
import { useConfirmModalHelpers } from '@/hooks/useConfirmModal';

const MyComponent = () => {
  const { confirmDelete, confirmAction } = useConfirmModalHelpers();

  const handleDeleteUser = () => {
    confirmDelete('John Doe', async () => {
      await deleteUser();
    });
  };

  const handleUpdateSettings = () => {
    confirmAction(
      'Update Settings',
      'This will update system settings. Continue?',
      async () => {
        await updateSettings();
      }
    );
  };

  return (
    <div>
      <button onClick={handleDeleteUser}>Delete User</button>
      <button onClick={handleUpdateSettings}>Update Settings</button>
    </div>
  );
};
```

## Components

### ConfirmModal

The main modal component with full customization options.

```tsx
<ConfirmModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
  confirmText="Confirm"
  cancelText="Cancel"
  variant="danger"
  isLoading={false}
  disabled={false}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Controls modal visibility |
| `onClose` | `() => void` | - | Called when modal is closed |
| `onConfirm` | `() => void \| Promise<void>` | - | Called when user confirms |
| `title` | `string` | - | Modal title |
| `message` | `string` | - | Modal message/description |
| `confirmText` | `string` | `'Confirm'` | Confirm button text |
| `cancelText` | `string` | `'Cancel'` | Cancel button text |
| `variant` | `'danger' \| 'warning' \| 'info' \| 'success'` | `'danger'` | Visual variant |
| `isLoading` | `boolean` | `false` | Shows loading state |
| `disabled` | `boolean` | `false` | Disables confirm button |

### ConfirmModalProvider

Context provider that wraps your app and provides the modal functionality.

```tsx
import { ConfirmModalProvider } from '@/components/common/ConfirmModalProvider';

function App() {
  return (
    <ConfirmModalProvider>
      <YourApp />
    </ConfirmModalProvider>
  );
}
```

## Hooks

### useConfirmModal

Core hook for managing modal state.

```tsx
const {
  isOpen,
  options,
  confirm,
  close,
  handleConfirm,
  handleCancel,
} = useConfirmModal();
```

### useConfirmModalHelpers

Convenience hook with pre-configured confirmation types.

```tsx
const {
  confirmDelete,
  confirmAction,
  confirmInfo,
  confirmSuccess,
} = useConfirmModalHelpers();
```

#### Helper Functions

- **`confirmDelete(itemName, onConfirm, options?)`**: Pre-configured delete confirmation
- **`confirmAction(title, message, onConfirm, options?)`**: General action confirmation
- **`confirmInfo(title, message, onConfirm, options?)`**: Information confirmation
- **`confirmSuccess(title, message, onConfirm, options?)`**: Success confirmation

### useConfirmModalContext

Hook to access the modal context from anywhere in your app.

```tsx
const { confirm } = useConfirmModalContext();
```

## Variants

### Danger (Red)
- **Icon**: AlertTriangle
- **Colors**: Red theme
- **Use Case**: Destructive actions (delete, remove, destroy)

### Warning (Yellow)
- **Icon**: AlertCircle
- **Colors**: Yellow theme
- **Use Case**: Cautionary actions (update, modify, suspend)

### Info (Blue)
- **Icon**: Info
- **Colors**: Blue theme
- **Use Case**: Informational actions (proceed, continue, archive)

### Success (Green)
- **Icon**: CheckCircle
- **Colors**: Green theme
- **Use Case**: Positive actions (activate, enable, approve)

## Accessibility Features

- **ARIA Roles**: Proper dialog and modal roles
- **Focus Trap**: Tab navigation stays within modal
- **Keyboard Support**: ESC to close, Enter to confirm
- **Screen Reader**: Proper labels and descriptions
- **High Contrast**: Works with system accessibility settings

## Styling

The modal uses Tailwind CSS classes that automatically adapt to your theme:

- **Light Mode**: White backgrounds, gray text
- **Dark Mode**: Dark backgrounds, light text
- **Responsive**: Works on all screen sizes
- **Consistent**: Matches your existing design system

## Examples

### Delete Confirmation
```tsx
confirmDelete('User Account', async () => {
  await deleteUser(userId);
  toast.success('User deleted successfully');
});
```

### Bulk Action
```tsx
confirmAction(
  'Bulk Delete',
  `Are you sure you want to delete ${selectedItems.length} items?`,
  async () => {
    await bulkDelete(selectedItems);
  },
  {
    confirmText: 'Delete All',
    variant: 'danger'
  }
);
```

### System Update
```tsx
confirmInfo(
  'System Update',
  'A system update is available. This may take 5-10 minutes to complete.',
  async () => {
    await startSystemUpdate();
  }
);
```

## Demo

Visit `/superadmin/confirm-modal-demo` to see all variants and examples in action.

## Integration

The modal is already integrated into the root layout, so you can use it anywhere in your app:

```tsx
// Any component in your app
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

const MyComponent = () => {
  const { confirm } = useConfirmModalContext();
  
  // Use the modal...
};
```

## Best Practices

1. **Use Appropriate Variants**: Choose the variant that matches the action's severity
2. **Clear Messages**: Provide specific, actionable messages
3. **Loading States**: Show loading state for async operations
4. **Error Handling**: Handle errors gracefully in your onConfirm callbacks
5. **Accessibility**: Test with screen readers and keyboard navigation
6. **Consistent Language**: Use consistent button text across your app

## Troubleshooting

### Modal Not Showing
- Ensure `ConfirmModalProvider` wraps your component
- Check that `isOpen` is `true`
- Verify no CSS z-index conflicts

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check for conflicting CSS classes
- Verify dark mode is working correctly

### Accessibility Issues
- Test with keyboard navigation (Tab, Enter, Escape)
- Verify screen reader compatibility
- Check ARIA attributes are present 