-- Test database seeding script for multi-tenant application

-- Clear existing test data
DELETE FROM notifications WHERE id LIKE 'test-%';
DELETE FROM support_tickets WHERE id LIKE 'test-%'; 
DELETE FROM user_roles WHERE user_id LIKE 'test-%';
DELETE FROM users WHERE id LIKE 'test-%';
DELETE FROM roles WHERE id LIKE 'test-%';
DELETE FROM tenants WHERE id LIKE 'test-%';
DELETE FROM super_admins WHERE id LIKE 'test-%';

-- Insert test Super Admins
INSERT INTO super_admins (id, email, password, name, status, created_at) VALUES
('test-sa-1', 'admin@superadmin.com', '$2b$10$hash1', 'Super Admin', 'active', '2024-01-01 00:00:00'),
('test-sa-2', 'inactive@superadmin.com', '$2b$10$hash2', 'Inactive Super Admin', 'inactive', '2024-01-01 00:00:00');

-- Insert test Tenants
INSERT INTO tenants (id, slug, name, domain, status, settings, created_at) VALUES
('test-t-1', 'tenant1', 'Tenant One Corp', 'tenant1.example.com', 'active', '{"theme":"blue","language":"en","modules":["users","roles","audit","reports"]}', '2024-01-01 00:00:00'),
('test-t-2', 'tenant2', 'Tenant Two Inc', 'tenant2.example.com', 'active', '{"theme":"green","language":"en","modules":["users","roles"]}', '2024-01-01 00:00:00'),
('test-t-3', 'tenant3', 'Tenant Three LLC', 'tenant3.example.com', 'active', '{"theme":"purple","language":"fr","modules":["users","roles","audit","reports","support"]}', '2024-01-01 00:00:00'),
('test-t-4', 'disabled-tenant', 'Disabled Tenant', 'disabled.example.com', 'inactive', '{"theme":"red","language":"en","modules":[]}', '2024-01-01 00:00:00');

-- Insert test Roles
INSERT INTO roles (id, name, tenant_id, permissions, created_at) VALUES
('test-r-1', 'admin', 'test-t-1', '["users.read","users.create","users.update","users.delete","roles.read","roles.create","roles.update","roles.delete"]', '2024-01-01 00:00:00'),
('test-r-2', 'manager', 'test-t-1', '["users.read","users.create","roles.read"]', '2024-01-01 00:00:00'),
('test-r-3', 'user', 'test-t-1', '["users.read"]', '2024-01-01 00:00:00'),
('test-r-4', 'admin', 'test-t-2', '["users.read","users.create","users.update","users.delete"]', '2024-01-01 00:00:00');

-- Insert test Users  
INSERT INTO users (id, email, password, name, tenant_id, status, created_at) VALUES
('test-u-1', 'admin@tenant1.com', '$2b$10$hash3', 'Tenant 1 Admin', 'test-t-1', 'active', '2024-01-01 00:00:00'),
('test-u-2', 'manager@tenant1.com', '$2b$10$hash4', 'Tenant 1 Manager', 'test-t-1', 'active', '2024-01-01 00:00:00'),
('test-u-3', 'user@tenant1.com', '$2b$10$hash5', 'Tenant 1 User', 'test-t-1', 'active', '2024-01-01 00:00:00'),
('test-u-4', 'admin@tenant2.com', '$2b$10$hash6', 'Tenant 2 Admin', 'test-t-2', 'active', '2024-01-01 00:00:00'),
('test-u-5', 'disabled@tenant1.com', '$2b$10$hash7', 'Disabled User', 'test-t-1', 'inactive', '2024-01-01 00:00:00');

-- Insert test User Roles
INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
('test-u-1', 'test-r-1', '2024-01-01 00:00:00'),
('test-u-2', 'test-r-2', '2024-01-01 00:00:00'),
('test-u-3', 'test-r-3', '2024-01-01 00:00:00'),
('test-u-4', 'test-r-4', '2024-01-01 00:00:00');

-- Insert test Notifications
INSERT INTO notifications (id, title, message, type, tenant_id, user_id, read, created_at) VALUES
('test-n-1', 'Welcome Message', 'Welcome to the platform', 'info', 'test-t-1', 'test-u-1', false, '2024-01-01 00:00:00'),
('test-n-2', 'System Update', 'System will be updated tonight', 'warning', 'test-t-1', 'test-u-2', false, '2024-01-01 00:00:00'),
('test-n-3', 'Tenant 2 Notification', 'Tenant 2 specific message', 'info', 'test-t-2', 'test-u-4', true, '2024-01-01 00:00:00');

-- Insert test Support Tickets
INSERT INTO support_tickets (id, title, description, status, priority, tenant_id, user_id, created_at) VALUES
('test-st-1', 'Login Issue', 'Cannot login to dashboard', 'open', 'high', 'test-t-1', 'test-u-1', '2024-01-01 00:00:00'),
('test-st-2', 'Feature Request', 'Need new reporting feature', 'in_progress', 'medium', 'test-t-1', 'test-u-2', '2024-01-01 00:00:00'),
('test-st-3', 'Bug Report', 'Table sorting not working', 'closed', 'low', 'test-t-2', 'test-u-4', '2024-01-01 00:00:00');

-- Create indexes for better test performance
CREATE INDEX IF NOT EXISTS idx_test_users_tenant ON users(tenant_id) WHERE id LIKE 'test-%';
CREATE INDEX IF NOT EXISTS idx_test_notifications_tenant ON notifications(tenant_id) WHERE id LIKE 'test-%';
CREATE INDEX IF NOT EXISTS idx_test_support_tickets_tenant ON support_tickets(tenant_id) WHERE id LIKE 'test-%';
