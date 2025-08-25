# Enhanced Analytics Dashboard

## Overview

The Enhanced Analytics Dashboard provides comprehensive insights into tenant organization performance and security with 4 different types of charts, all with permission-based visibility.

## Features

### 1. User Growth & Activity Chart (Area Chart)
- **Permission Required**: `canViewUsers`
- **Chart Type**: Multi-line area chart with gradient fill
- **Data Points**:
  - Total Users
  - Active Users  
  - New Users
- **Features**:
  - Smooth animations
  - Gradient fill effects
  - Interactive tooltips
  - Export functionality

### 2. Role Distribution Chart (Donut Chart)
- **Permission Required**: `canViewRoles`
- **Chart Type**: Donut chart with percentage labels
- **Data Points**:
  - Role names
  - User count per role
- **Features**:
  - Percentage calculations
  - Color-coded segments
  - Legend positioning
  - Export functionality

### 3. System Performance Chart (Multi-line Chart)
- **Permission Required**: `canViewAnalytics`
- **Chart Type**: Multi-line chart with dual Y-axis
- **Data Points**:
  - Response Time (ms)
  - Uptime (%)
  - Error Count
- **Features**:
  - Dual Y-axis support
  - Performance metrics
  - Real-time data simulation
  - Export functionality

### 4. Security Events Chart (Stacked Bar Chart)
- **Permission Required**: `canViewAudit`
- **Chart Type**: Stacked bar chart
- **Data Points**:
  - Failed Logins
  - Suspicious Activity
  - Blocked Attempts
- **Features**:
  - Stacked visualization
  - Security event tracking
  - Color-coded severity
  - Export functionality

## Permission-Based Visibility

Each chart is only visible to users with the appropriate permissions:

- **User Analytics**: Requires `users` module read permission
- **Role Analytics**: Requires `roles` module read permission  
- **Performance Analytics**: Requires `analytics` module read permission
- **Security Analytics**: Requires `audit` module read permission

## Chart Controls

### Visibility Toggles
- Individual toggle buttons for each chart type
- Color-coded buttons matching chart themes
- Eye/Eye-off icons for clear visual feedback

### Refresh Functionality
- Manual refresh button with loading state
- Automatic data updates
- Error handling with user feedback

### Export Features
- Individual chart export buttons
- Success notifications
- Download functionality (simulated)

## Summary Cards

Each chart type has a corresponding summary card showing:
- Key metrics
- Growth indicators
- Status information
- Color-coded themes

## Technical Implementation

### API Endpoint
- **Route**: `/api/tenant/[tenantSlug]/dashboard/enhanced-analytics`
- **Method**: GET
- **Parameters**: `range` (1d, 7d, 30d, 90d)
- **Response**: Structured chart data with permission checks

### Data Sources
- **User Growth**: Real user data from database
- **Role Distribution**: Actual role assignments
- **System Performance**: Simulated performance metrics
- **Security Events**: Real audit log data

### Fallback Data
- Automatic fallback data generation when API fails
- Realistic data patterns
- Graceful degradation

## Usage

1. Navigate to tenant dashboard
2. Ensure user has appropriate permissions
3. Use visibility toggles to show/hide charts
4. Click refresh to update data
5. Use export buttons to download charts

## Benefits Over Superadmin Dashboard

1. **More Charts**: 4 specialized charts vs basic overview
2. **Better Visualizations**: Area charts, donut charts, multi-line charts
3. **Permission-Based**: Granular control over what users can see
4. **Interactive Controls**: Toggle visibility, refresh, export
5. **Enhanced UX**: Better animations, tooltips, and feedback
6. **Real Data**: Actual tenant-specific data vs aggregated data
7. **Summary Cards**: Quick insights alongside detailed charts

## Future Enhancements

- Real-time data streaming
- Custom date range picker
- Advanced filtering options
- Chart comparison features
- Automated insights and recommendations
- Mobile-responsive optimizations
