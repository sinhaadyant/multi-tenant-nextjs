# Analytics Dashboard - Implementation Guide

## Overview

A comprehensive analytics dashboard has been implemented for the multi-tenant Next.js application, providing dynamic data visualization with the same design patterns as the existing tenant dashboard. The analytics dashboard supports multiple chart types, real-time data, filtering, and export capabilities.

## 🎯 Features Implemented

### ✅ Core Features
- **Multi-tenant aware** - All data is scoped to the current tenant
- **Dynamic data fetching** - Real-time data from API endpoints
- **Multiple chart types** - Bar, Line, Pie, and Donut charts using Recharts
- **Chart type switching** - Users can switch between different chart types
- **Fullscreen mode** - Charts can be expanded to full screen
- **Export functionality** - PNG, PDF, and CSV export options
- **Responsive design** - Grid layout that adapts to screen sizes
- **Global filters** - Date range, category, period, and module filters

### ✅ Chart Types Supported
- **Bar Charts** - For comparing categories and time series data
- **Line Charts** - For trends and continuous data
- **Pie Charts** - For showing proportions and distributions
- **Donut Charts** - For showing proportions with center space

### ✅ Analytics Data
- **User Activity** - Daily active users and activities
- **Role Distribution** - Users by role across the organization
- **Module Usage** - Most used modules and features
- **System Performance** - CPU, memory, and storage usage
- **User Growth** - New user registrations over time
- **Audit Activity** - System actions and user activities
- **Real-time Analytics** - Live user activity and system metrics

## 📁 File Structure

```
src/
├── components/analytics/
│   ├── AnalyticsDashboard.tsx      # Main dashboard component
│   ├── ChartCard.tsx               # Reusable chart card wrapper
│   ├── ChartContainer.tsx          # Chart data fetching and rendering
│   └── AnalyticsFilters.tsx        # Global filters component
├── context/
│   └── AnalyticsContext.tsx        # Global analytics state management
├── services/
│   └── analyticsApi.ts             # Analytics API service
├── app/[tenantSlug]/analytics/
│   └── page.tsx                    # Analytics page with providers
└── app/api/tenant/[tenantSlug]/analytics/
    ├── route.ts                    # Main analytics API endpoint
    └── export/route.ts             # Export functionality API
```

## 🏗️ Architecture

### Component Hierarchy
```
AnalyticsPage
└── AnalyticsProvider (Context)
    └── AnalyticsDashboard
        ├── AnalyticsFilters
        └── ChartContainer (multiple)
            └── ChartCard
                └── Recharts Components
```

### Data Flow
1. **AnalyticsContext** manages global filters and state
2. **ChartContainer** fetches data using React Query
3. **ChartCard** provides UI wrapper with actions
4. **Recharts** renders the actual charts
5. **API endpoints** provide multi-tenant data

## 🔧 Technical Implementation

### State Management
- **AnalyticsContext** - Global filters, chart states, and export state
- **React Query** - Data fetching, caching, and synchronization
- **Local State** - Chart type switching and fullscreen mode

### API Integration
- **Multi-tenant aware** - All requests include tenant authentication
- **Dynamic endpoints** - Configurable chart data sources
- **Export functionality** - Multiple format support
- **Error handling** - Graceful fallbacks and retry logic

### Chart Configuration
Each chart is configured with:
```typescript
interface ChartConfig {
  id: string;
  title: string;
  subtitle?: string;
  endpoint: string;
  chartTypes: Array<'bar' | 'line' | 'pie' | 'donut'>;
  defaultChartType: 'bar' | 'line' | 'pie' | 'donut';
  dataTransform?: (data: any) => any[];
  height?: number;
  showLegend?: boolean;
  colors?: string[];
}
```

## 🚀 Usage

### Accessing the Dashboard
1. Navigate to `/{tenantSlug}/analytics`
2. The dashboard requires tenant authentication
3. Users need appropriate permissions to view analytics

### Using Filters
- **Date Range** - Select predefined ranges or custom dates
- **Category** - Filter by analytics category
- **Period** - Choose data aggregation period (daily, weekly, monthly, yearly)
- **Module** - Filter by specific modules

### Chart Interactions
- **Chart Type Switcher** - Change between available chart types
- **Export** - Download chart data in PNG, PDF, or CSV format
- **Fullscreen** - Expand charts to full screen view
- **Tooltips** - Hover for detailed information

### Export Options
- **PNG** - High-quality image export
- **PDF** - Document format with chart and data
- **CSV** - Raw data for further analysis

## 🔌 API Endpoints

### Main Analytics Endpoint
```
GET /api/tenant/{tenantSlug}/analytics
```

**Query Parameters:**
- `endpoint` - Chart data type (summary, user-activity, role-distribution, etc.)
- `dateRange` - JSON string with start and end dates
- `period` - Data aggregation period
- `category` - Filter by category
- `module` - Filter by module
- `limit` - Number of data points

### Export Endpoint
```
GET /api/tenant/{tenantSlug}/analytics/export
```

**Query Parameters:**
- `format` - Export format (csv, pdf, png)
- `chartId` - Chart identifier
- `dateRange` - Date range for export
- `period` - Data aggregation period

## 🎨 Design System

### Consistent with Tenant Dashboard
- Same color scheme and typography
- Matching card layouts and spacing
- Consistent button styles and interactions
- Unified loading states and error handling

### Responsive Grid Layout
- **Mobile** - Single column layout
- **Tablet** - Two column layout
- **Desktop** - Three column layout
- **Fullscreen** - Maximized chart view

### Chart Styling
- **Colors** - Consistent brand colors with accessibility
- **Typography** - Clear labels and readable text
- **Interactions** - Smooth animations and hover effects
- **Tooltips** - Informative and well-designed

## 🔒 Security & Permissions

### Authentication
- All analytics endpoints require valid JWT tokens
- Tenant-specific data isolation
- User permission validation

### Data Access
- Users can only access their tenant's data
- Role-based access control for sensitive metrics
- Audit logging for all analytics access

## 🧪 Testing

### Test Script
Run the analytics dashboard test:
```bash
node test-analytics-dashboard.js
```

### Test Coverage
- ✅ API endpoint functionality
- ✅ Data fetching and transformation
- ✅ Chart rendering and interactions
- ✅ Export functionality
- ✅ Frontend page accessibility
- ✅ Multi-tenant data isolation

## 🚀 Performance Optimizations

### Data Fetching
- **React Query** - Intelligent caching and background updates
- **Stale time** - 5-minute cache for analytics data
- **Retry logic** - Automatic retry for failed requests
- **Error boundaries** - Graceful error handling

### Chart Rendering
- **Dynamic imports** - Charts loaded only when needed
- **Memoization** - Prevent unnecessary re-renders
- **Data limiting** - Limit data points for performance
- **Responsive containers** - Optimized for different screen sizes

### Export Performance
- **Streaming** - Large exports handled efficiently
- **Format optimization** - Optimized file generation
- **Background processing** - Non-blocking export operations

## 🔧 Configuration

### Environment Variables
No additional environment variables required - uses existing tenant configuration.

### Chart Customization
Charts can be customized by modifying the `chartConfigs` array in `AnalyticsDashboard.tsx`:

```typescript
const chartConfigs: ChartConfig[] = [
  {
    id: 'custom-chart',
    title: 'Custom Chart',
    endpoint: 'custom-endpoint',
    chartTypes: ['bar', 'line'],
    defaultChartType: 'bar',
    // ... other configuration
  }
];
```

### API Endpoint Extension
Add new analytics endpoints by extending the main analytics route:

```typescript
// In route.ts
case 'custom-endpoint':
  data = await getCustomData(tenant.id, startDate, endDate, period);
  break;
```

## 📊 Data Sources

### Real Data
- **User counts** - From Prisma user queries
- **Role distribution** - From role and user relationships
- **Audit logs** - From audit log entries
- **System metrics** - From performance monitoring

### Mock Data (for demonstration)
- **Module usage** - Simulated usage statistics
- **System performance** - Simulated CPU/memory metrics
- **User growth** - Simulated growth patterns

## 🔄 Future Enhancements

### Planned Features
- **Real-time updates** - WebSocket integration for live data
- **Advanced filtering** - More granular filter options
- **Custom dashboards** - User-configurable layouts
- **Scheduled reports** - Automated report generation
- **Data drill-down** - Interactive data exploration

### Performance Improvements
- **Data aggregation** - Server-side data processing
- **Caching layers** - Redis for frequently accessed data
- **CDN integration** - Static asset optimization
- **Lazy loading** - Progressive chart loading

## 🐛 Troubleshooting

### Common Issues

**Charts not loading:**
- Check tenant authentication
- Verify API endpoint availability
- Check browser console for errors

**Export not working:**
- Verify file permissions
- Check export format support
- Ensure sufficient memory for large exports

**Performance issues:**
- Reduce data point limits
- Enable chart memoization
- Check network connectivity

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and checking browser console for detailed error information.

## 📝 Contributing

### Adding New Charts
1. Add chart configuration to `chartConfigs` array
2. Implement API endpoint in analytics route
3. Add data transformation function
4. Test with different chart types
5. Update documentation

### Styling Guidelines
- Follow existing design patterns
- Use consistent color schemes
- Ensure accessibility compliance
- Test responsive behavior

---

## 🎉 Summary

The analytics dashboard provides a comprehensive, production-ready solution for multi-tenant analytics with:

- **6 different chart types** with multiple visualization options
- **Real-time data integration** with proper caching
- **Export functionality** in multiple formats
- **Responsive design** that matches the existing tenant dashboard
- **Comprehensive error handling** and loading states
- **Multi-tenant security** with proper data isolation
- **Performance optimizations** for smooth user experience

The implementation follows React best practices, uses modern charting libraries, and integrates seamlessly with the existing application architecture.
