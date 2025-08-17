// Core UI Components
export { Button } from "./button";
export { Input } from "./input";
export { Label } from "./label";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
export { Checkbox } from "./checkbox";
export { Switch } from "./switch";

// Navigation & Layout
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
export { Badge } from "./badge";
export { Avatar, AvatarFallback, AvatarImage } from "./avatar";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
export { Popover, PopoverContent, PopoverTrigger } from "./popover";
export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

// Loading & Feedback
export { Skeleton } from "./skeleton";

// Alert Components
export { default as Alert } from "./alert/Alert";

// Form Components
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

// Notifications
export { Toaster } from "./sonner";
export { NotificationProvider } from "./NotificationProvider";
export { CustomNotification } from "./CustomNotification";
export { LoadingNotification } from "./LoadingNotification";

// Custom Components
export { ErrorBoundary } from "./ErrorBoundary";
export { LoadingWrapper } from "./LoadingWrapper";

// DataTable Components
export { DataTable, DataTableExample } from "./DataTable";

// Command Components
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command";

// Multi-Select Component
export { MultiSelect } from "./multi-select";

// Activity Logs Component
export { ActivityLogs } from "./ActivityLogs";

// Permission Matrix Component
export { PermissionMatrix } from "./PermissionMatrix";

// Skeleton Components
export {
  SkeletonLoader,
  SkeletonCard,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonUserCard,
  SkeletonStats,
  SkeletonForm,
  SkeletonChart,
  SkeletonList,
} from "./skeleton/SkeletonLoader";

// Note: shadcn/UI components use React.ComponentProps for type inference
// Use React.ComponentProps<typeof ComponentName> for prop types
