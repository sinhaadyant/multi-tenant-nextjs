import React from "react";
import { useParams } from "next/navigation";
import { Activity, Users, Bell } from "lucide-react";

// Custom hook to safely get tenant info
const useSafeTenantAuth = () => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  // Check if we're in a tenant context
  const isTenantContext = !!tenantSlug;
  
  if (!isTenantContext) {
    return { tenant: null, isTenantContext: false };
  }
  
  try {
    const { useTenantAuth } = require("../context/TenantAuthContext");
    const { tenant } = useTenantAuth();
    return { tenant, isTenantContext: true };
  } catch (error) {
    // TenantAuthProvider not available
    console.log('TenantAuthProvider not available, using fallback');
    return { tenant: null, isTenantContext: true };
  }
};

export default function SidebarWidget() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, isTenantContext } = useSafeTenantAuth();

  return (
    <div
      className={`
        mx-auto mb-6 w-full max-w-60 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 px-4 py-4 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800`}
    >
      <div className="flex items-center space-x-2 mb-3">
        <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Quick Stats
        </h3>
      </div>
      
      <div className="space-y-2">
        {isTenantContext ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Plan:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {tenant?.plan || 'Standard'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-600 dark:text-green-400">Active</span>
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            SuperAdmin Dashboard
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
        {isTenantContext ? (
          <a
            href={`/${tenantSlug}/settings`}
            className="flex items-center justify-center p-2 font-medium text-blue-600 dark:text-blue-400 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Manage Settings
          </a>
        ) : (
          <a
            href="/superadmin/settings"
            className="flex items-center justify-center p-2 font-medium text-blue-600 dark:text-blue-400 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            SuperAdmin Settings
          </a>
        )}
      </div>
    </div>
  );
}
