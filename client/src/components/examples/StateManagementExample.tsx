"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useAppSelector } from "@/store/hooks";
import { notificationService } from "@/services/notificationService";

export function StateManagementExample() {
  const auth = useAuth();
  const tenant = useTenant();
  const ui = useAppSelector(state => state.ui);

  const handleTestNotification = () => {
    notificationService.success({
      title: "Test Success",
      message: "This is a test success notification!",
    });
  };

  const handleTestError = () => {
    notificationService.error({
      title: "Test Error",
      message: "This is a test error notification!",
    });
  };

  const handleToggleSidebar = () => {
    // This would be handled by the UI slice
    console.log("Toggle sidebar clicked");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Status:</strong>{" "}
            {auth.isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </div>
          {auth.user && (
            <div>
              <strong>User:</strong> {auth.user.name} ({auth.user.email})
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() =>
                auth.login({
                  email: "test@example.com",
                  password: "password",
                })
              }
              disabled={auth.isLoginLoading}
            >
              {auth.isLoginLoading ? "Logging in..." : "Test Login"}
            </Button>
            <Button
              variant="outline"
              onClick={() => auth.logout()}
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Current Tenant:</strong>{" "}
            {tenant.currentTenant?.name || "None selected"}
          </div>
          <div>
            <strong>Available Tenants:</strong> {tenant.availableTenants.length}
          </div>
          <Button
            onClick={() => tenant.fetchTenants()}
            disabled={tenant.isFetchingTenants}
          >
            {tenant.isFetchingTenants ? "Fetching..." : "Fetch Tenants"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UI State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Sidebar Open:</strong> {ui.sidebarOpen ? "Yes" : "No"}
          </div>
          <div>
            <strong>Theme:</strong> {ui.theme}
          </div>
          <div>
            <strong>Notifications:</strong> {ui.notifications.length}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestNotification}>
              Test Success Notification
            </Button>
            <Button variant="destructive" onClick={handleTestError}>
              Test Error Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
