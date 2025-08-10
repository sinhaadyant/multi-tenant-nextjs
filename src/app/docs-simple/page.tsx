export default function SimpleDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            API Documentation
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Complete API documentation for the Multi-Tenant Next.js application. 
            This documentation covers all endpoints for SuperAdmin and Tenant management, 
            including authentication, user management, audit logs, and more.
          </p>
        </div>

        {/* Credentials Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Available Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">SuperAdmin</h3>
              <p className="text-sm text-gray-600 mb-2">admin@superadmin.com</p>
              <p className="text-sm text-gray-600">AdminPass123</p>
              <a href="http://localhost:3000/superadmin/login" className="text-blue-600 text-sm hover:underline">
                Login →
              </a>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">TechCorp Solutions</h3>
              <p className="text-sm text-gray-600 mb-2">admin@techcorp.com</p>
              <p className="text-sm text-gray-600">AdminPass123</p>
              <a href="http://localhost:3000/techcorp/login" className="text-blue-600 text-sm hover:underline">
                Login →
              </a>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Global Retail Inc</h3>
              <p className="text-sm text-gray-600 mb-2">admin@globalretail.com</p>
              <p className="text-sm text-gray-600">AdminPass123</p>
              <a href="http://localhost:3000/globalretail/login" className="text-blue-600 text-sm hover:underline">
                Login →
              </a>
            </div>
          </div>
        </div>

        {/* API Endpoints Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
            
            <div className="space-y-6">
              {/* Authentication */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Authentication</h3>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      POST /api/superadmin/auth/login
                    </code>
                    <p className="text-xs text-gray-600 mt-1">SuperAdmin login</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      POST /api/auth/login
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Tenant login</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      POST /api/auth/refresh
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Refresh token</p>
                  </div>
                </div>
              </div>

              {/* SuperAdmin APIs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">SuperAdmin APIs</h3>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      GET /api/superadmin/dashboard/stats
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Dashboard statistics</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      GET /api/superadmin/tenants
                    </code>
                    <p className="text-xs text-gray-600 mt-1">List all tenants</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      GET /api/superadmin/users
                    </code>
                    <p className="text-xs text-gray-600 mt-1">List all users</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      GET /api/superadmin/audit-logs
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Audit logs</p>
                  </div>
                </div>
              </div>

              {/* Tenant APIs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Tenant APIs</h3>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      GET /api/tenant/dashboard
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Tenant dashboard</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      GET /api/tenant/users
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Tenant users</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      GET /api/tenant/audit-logs
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Tenant audit logs</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <code className="text-sm">
                      POST /api/tenant/support
                    </code>
                    <p className="text-xs text-gray-600 mt-1">Create support ticket</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Documentation Links</h2>
            <div className="space-y-3">
              <div>
                <a href="/api/docs" className="text-blue-600 hover:underline">
                  Raw OpenAPI Specification →
                </a>
                <p className="text-sm text-gray-600">JSON format API specification</p>
              </div>
              <div>
                <a href="/api-docs" className="text-blue-600 hover:underline">
                  Formatted API Specification →
                </a>
                <p className="text-sm text-gray-600">Readable API specification</p>
              </div>
              <div>
                <a href="/docs" className="text-blue-600 hover:underline">
                  Interactive Swagger UI →
                </a>
                <p className="text-sm text-gray-600">Interactive API documentation (if available)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testing Information */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">Testing the APIs</h2>
          <div className="space-y-2 text-sm text-green-800">
            <p>• Use the Postman collection: <code className="bg-green-100 px-2 py-1 rounded">postman-collection.json</code></p>
            <p>• Import into Postman and set environment variables</p>
            <p>• Start with SuperAdmin or Tenant login to get authentication tokens</p>
            <p>• All endpoints support pagination, search, and filtering</p>
          </div>
        </div>
      </div>
    </div>
  );
} 