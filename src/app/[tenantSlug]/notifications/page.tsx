import React from 'react';
import TenantNotificationsList from '@/components/tenant/notifications/TenantNotificationsList';

const TenantNotificationsPage: React.FC = () => {
  return (
    <div className="p-6">
      <TenantNotificationsList />
    </div>
  );
};

export default TenantNotificationsPage; 