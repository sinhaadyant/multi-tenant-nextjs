"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  SkeletonLoader,
  SkeletonCard,
  SkeletonTable,
  SkeletonUserCard,
  SkeletonStats,
  SkeletonForm,
  SkeletonChart,
  SkeletonList,
} from "@/components/ui/skeleton/SkeletonLoader";

// Component that throws an error for testing
function ErrorComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("This is a test error for the ErrorBoundary!");
  }
  return <div>This component works normally</div>;
}

export default function LoadingDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldThrowError, setShouldThrowError] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Loading & Error Handling Demo</h1>
        <div className="flex gap-2">
          <Button onClick={simulateLoading} disabled={isLoading}>
            {isLoading ? "Loading..." : "Simulate Loading"}
          </Button>
          <Button
            onClick={() => setShouldThrowError(!shouldThrowError)}
            variant="destructive"
          >
            {shouldThrowError ? "Reset Error" : "Trigger Error"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Loading Wrapper Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Wrapper Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Loading:</h4>
              <LoadingWrapper isLoading={isLoading} skeleton="basic">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  This content will be replaced with a skeleton when loading
                </div>
              </LoadingWrapper>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Card Loading:</h4>
              <LoadingWrapper isLoading={isLoading} skeleton="card">
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h3 className="font-semibold">Sample Card</h3>
                  <p>This is sample card content</p>
                </div>
              </LoadingWrapper>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Table Loading:</h4>
              <LoadingWrapper
                isLoading={isLoading}
                skeleton="table"
                skeletonProps={{ rows: 3, columns: 4 }}
              >
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <h3 className="font-semibold">Sample Table</h3>
                  <p>This would be a table component</p>
                </div>
              </LoadingWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Individual Skeleton Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Skeleton Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">User Card:</h4>
              <SkeletonUserCard />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Stats Grid:</h4>
              <SkeletonStats count={2} />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Form:</h4>
              <SkeletonForm fields={3} />
            </div>
          </CardContent>
        </Card>

        {/* Error Boundary Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Error Boundary Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <ErrorComponent shouldThrow={shouldThrowError} />
            </ErrorBoundary>
          </CardContent>
        </Card>

        {/* More Skeleton Examples */}
        <Card>
          <CardHeader>
            <CardTitle>More Skeleton Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Chart:</h4>
              <SkeletonChart height="h-32" />
            </div>

            <div>
              <h4 className="font-semibold mb-2">List:</h4>
              <SkeletonList items={3} />
            </div>

            <div>
              <h4 className="font-semibold mb-2">Custom Skeleton:</h4>
              <SkeletonLoader
                count={3}
                height="h-6"
                width="w-full"
                className="space-y-3"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Basic Loading Wrapper:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {`<LoadingWrapper isLoading={isLoading} skeleton="basic">
  <YourComponent />
</LoadingWrapper>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Custom Skeleton:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {`<LoadingWrapper 
  isLoading={isLoading} 
  skeleton="table"
  skeletonProps={{ rows: 5, columns: 4 }}
>
  <YourTableComponent />
</LoadingWrapper>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Error Boundary:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {`<ErrorBoundary fallback={<CustomErrorUI />}>
  <ComponentThatMightError />
</ErrorBoundary>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Individual Skeletons:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {`<SkeletonUserCard />
<SkeletonStats count={4} />
<SkeletonForm fields={5} />
<SkeletonTable rows={10} columns={6} />`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
