"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  LoadingWrapper,
  SkeletonCard,
  SkeletonTable,
  SkeletonUserCard,
  SkeletonStats,
  SkeletonForm,
  SkeletonChart,
  SkeletonList,
} from "@/components/ui";
import { loginSchema, userSchema } from "@/lib/form";
import { dateUtils } from "@/lib/date";
import { 
  User, 
  Settings, 
  Bell, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Menu
} from "lucide-react";

export default function UIComponentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });
  const userForm = useForm({
    resolver: zodResolver(userSchema),
    mode: "onChange",
  });

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const onLoginSubmit = (data: any) => {
    console.log("Login data:", data);
  };

  const onUserSubmit = (data: any) => {
    console.log("User data:", data);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">UI Components Showcase</h1>
        <Button onClick={simulateLoading} disabled={isLoading}>
          {isLoading ? "Loading..." : "Simulate Loading"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="data">Data Display</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Different button variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button>
                  <User className="mr-2 h-4 w-4" />
                  With Icon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs & Labels</CardTitle>
              <CardDescription>Form inputs with labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input type="email" id="email" placeholder="Enter your email" />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input type="password" id="password" placeholder="Enter your password" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications">Enable notifications</Label>
              </div>
            </CardContent>
          </Card>

          {/* Select */}
          <Card>
            <CardHeader>
              <CardTitle>Select</CardTitle>
              <CardDescription>Dropdown select component</CardDescription>
            </CardHeader>
            <CardContent>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status and category badges</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>User avatar component</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle>Login Form</CardTitle>
              <CardDescription>Form with React Hook Form and Zod validation</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Login</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* User Form */}
          <Card>
            <CardHeader>
              <CardTitle>User Form</CardTitle>
              <CardDescription>Complex form with multiple fields</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center space-x-4">
                    <FormField
                      control={userForm.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Active</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="is_superadmin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Super Admin</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit">Create User</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>Table component with sample data</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of recent users.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">John Doe</TableCell>
                    <TableCell>john@example.com</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Jane Smith</TableCell>
                    <TableCell>jane@example.com</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>
                      <Badge variant="outline">Inactive</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Dropdown Menu */}
          <Card>
            <CardHeader>
              <CardTitle>Dropdown Menu</CardTitle>
              <CardDescription>Context menu with actions</CardDescription>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          {/* Popover */}
          <Card>
            <CardHeader>
              <CardTitle>Popover</CardTitle>
              <CardDescription>Floating content overlay</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Dimensions</h4>
                      <p className="text-sm text-muted-foreground">
                        Set the dimensions for the layer.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          defaultValue="100%"
                          className="col-span-2 h-8"
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="maxWidth">Max. width</Label>
                        <Input
                          id="maxWidth"
                          defaultValue="300px"
                          className="col-span-2 h-8"
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          defaultValue="25px"
                          className="col-span-2 h-8"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Dialog */}
          <Card>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
              <CardDescription>Modal dialog component</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Open Dialog</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                      Make changes to your profile here. Click save when you&apos;re done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        defaultValue="Pedro Duarte"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        defaultValue="@peduarte"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Sheet */}
          <Card>
            <CardHeader>
              <CardTitle>Sheet</CardTitle>
              <CardDescription>Side panel component</CardDescription>
            </CardHeader>
            <CardContent>
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <Menu className="mr-2 h-4 w-4" />
                    Open Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Edit profile</SheetTitle>
                    <SheetDescription>
                      Make changes to your profile here. Click save when you&apos;re done.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        defaultValue="Pedro Duarte"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        defaultValue="@peduarte"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Save changes</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>

          {/* Loading States */}
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
              <CardDescription>Skeleton loaders and loading wrappers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Loading Wrapper:</h4>
                <LoadingWrapper isLoading={isLoading} skeleton="card">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h3 className="font-semibold">Sample Content</h3>
                    <p>This content will be replaced with a skeleton when loading</p>
                  </div>
                </LoadingWrapper>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Individual Skeletons:</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <SkeletonUserCard />
                  <SkeletonStats count={2} />
                  <SkeletonForm fields={3} />
                  <SkeletonTable rows={3} columns={4} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Utils Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Date Utilities</CardTitle>
              <CardDescription>Date formatting and manipulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Current Date:</strong> {dateUtils.format(new Date())}
              </div>
              <div>
                <strong>Relative Time:</strong> {dateUtils.formatRelative(new Date())}
              </div>
              <div>
                <strong>Is Today:</strong> {dateUtils.isToday(new Date()) ? "Yes" : "No"}
              </div>
              <div>
                <strong>Start of Month:</strong> {dateUtils.format(dateUtils.startOfMonth(new Date()), "MMM dd, yyyy")}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
