# Analytics Page

## Overview

The Analytics Page provides comprehensive insights into tenant organization performance with dynamic, permission-based analytics sections.

## Features

### 1. User Analytics
- **Permission Required**: `canViewUsers`
- **Data Points**:
  - Total Users
  - Active Users
  - Inactive Users
  - New Users
  - User Growth Percentage
- **Chart Types**: Bar, Pie, Line, Area, Donut

### 2. Device Analytics
- **Permission Required**: `canViewAnalytics`
- **Data Points**:
  - Mobile Users
  - Desktop Users
  - Tablet Users
  - Device Breakdown with Percentages
- **Chart Types**: Bar, Pie, Line, Area, Donut

### 3. Login Matrix
- **Permission Required**: `canViewAnalytics`
- **Data Points**:
  - Successful Logins
  - Failed Logins
  - Login Trends Over Time
- **Chart Types**: Bar, Pie, Line, Area, Donut

### 4. Activity Log
- **Permission Required**: `canViewAudit`
- **Data Points**:
  - Total Activities
  - Recent Activities List
  - Activity Trends
- **Chart Types**: Bar, Pie, Line, Area, Donut

### 5. Support Tickets
- **Permission Required**: `canViewReports`
- **Data Points**:
  - Resolved Tickets
  - Pending Tickets
  - Closed Tickets
  - Ticket Trends
- **Chart Types**: Bar, Pie, Line, Area, Donut

### 6. Notification Status
- **Permission Required**: `canViewNotifications`
- **Data Points**:
  - Sent Notifications
  - Read Notifications
  - Unread Notifications
  - Notification Trends
- **Chart Types**: Bar, Pie, Line, Area, Donut

## Interactive Features

### Section Visibility Controls
- Toggle buttons for each analytics section
- Eye/Eye-off icons for clear visual feedback
- Permission-based visibility

### Chart Type Selection
- Dropdown menus for each chart
- 5 chart types: Bar, Pie, Line, Area, Donut
- Real-time chart type switching

### Time Range Selection
- Date filter dropdown (1d, 7d, 30d, 90d)
- Dynamic data updates based on selected range
- Consistent with dashboard functionality

### Refresh Functionality
- Manual refresh button with loading state
- Automatic data updates
- Error handling with user feedback

### Export Features
- Individual chart export buttons
- Success notifications
- Download functionality (simulated)

## Summary Cards

Each analytics section includes summary cards showing:
- Key metrics with color-coded themes
- Growth indicators
- Status information
- Real-time data updates

## Permission-Based Access

Each section is only visible to users with appropriate permissions:
- **User Analytics**: Requires `users` module read permission
- **Device Analytics**: Requires `analytics` module read permission
- **Login Matrix**: Requires `analytics` module read permission
- **Activity Log**: Requires `audit` module read permission
- **Support Tickets**: Requires `reports` module read permission
- **Notifications**: Requires `notifications` module read permission

## Technical Implementation

### API Endpoint
- **Route**: `/api/tenant/[tenantSlug]/analytics`
- **Method**: GET
- **Parameters**: `range` (1d, 7d, 30d, 90d)
- **Response**: Structured analytics data with permission checks

### Data Sources
- **User Analytics**: Real user data from database
- **Device Analytics**: Simulated device data
- **Login Matrix**: Real audit log data
- **Activity Log**: Real audit log data
- **Support Tickets**: Simulated ticket data
- **Notifications**: Simulated notification data

### Fallback Data
- Automatic fallback data generation when API fails
- Realistic data patterns
- Graceful degradation

## Usage

1. Navigate to `/[tenantSlug]/analytics`
2. Ensure user has appropriate permissions
3. Use section visibility toggles to show/hide sections
4. Select chart types from dropdowns
5. Choose time range from date filter
6. Click refresh to update data
7. Use export buttons to download charts

## Benefits

1. **Comprehensive Analytics**: 6 different analytics sections
2. **Dynamic Charts**: 5 chart types per section
3. **Permission-Based**: Granular control over visibility
4. **Interactive Controls**: Toggle visibility, change chart types, refresh
5. **Real Data**: Actual tenant-specific data where available
6. **Summary Cards**: Quick insights for each section
7. **Responsive Design**: Works on all screen sizes
8. **Time Range Support**: Flexible date filtering
9. **Export Functionality**: Chart download capabilities
10. **Error Handling**: Graceful fallbacks and user feedback

## Future Enhancements

- Real-time data streaming
- Advanced filtering options
- Chart comparison features
- Automated insights and recommendations
- Mobile-responsive optimizations
- Custom chart configurations
- Data export in multiple formats
- Scheduled reports
- Alert notifications
- Performance optimizations
