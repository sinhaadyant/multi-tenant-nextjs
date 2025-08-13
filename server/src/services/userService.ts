import bcrypt from 'bcryptjs';
import { UserRepository } from '@/repositories/userRepository';
import { AuditRepository } from '@/repositories/auditRepository';
import { env } from '@/config/env';
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  UserListParams,
  ChangePasswordInput,
} from '@/validation/userValidation';

export class UserService {
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create a new user with password hashing
   */
  async createUser(data: CreateUserInput, auditUserId?: string): Promise<any> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    // Create user data
    const userData = {
      name: data.name,
      email: data.email,
      passwordHash,
      tenantId: data.tenantId,
      isSuperadmin: data.isSuperadmin,
      isActive: data.isActive,
    };

    // Create user
    const user = await this.userRepository.create(userData);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'USER_CREATED',
        '127.0.0.1',
        { userId: user.id, email: user.email }
      );
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<any> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string, _tenantSlug?: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(credentials: {
    email: string;
    password: string;
    tenantSlug?: string;
  }): Promise<any> {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await this.userRepository.update(userId, {
      passwordHash,
    });
  }

  /**
   * List users with filters, pagination, and search
   */
  async listUsers(
    params: UserListParams
  ): Promise<{ users: any[]; total: number; meta: any }> {
    const { page, limit, filters, orderBy, orderDirection } = params;

    // Build orderBy object
    const orderByObj = { [orderBy]: orderDirection };

    // Get users and total count
    const [users, total] = await Promise.all([
      this.userRepository.findMany({
        page,
        limit,
        filters,
        orderBy: orderByObj,
      }),
      this.userRepository.count(filters),
    ]);

    return {
      users,
      total,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserInput,
    auditUserId?: string
  ): Promise<any> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if email is being updated and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(data.email);
      if (userWithEmail && userWithEmail.id !== id) {
        throw new Error('Email is already taken');
      }
    }

    // Hash password if provided
    let updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(
        data.password,
        env.BCRYPT_ROUNDS
      );
      delete updateData.password;
    }

    // Update user
    const user = await this.userRepository.update(id, updateData);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'USER_UPDATED',
        '127.0.0.1',
        { userId: user.id, updatedFields: Object.keys(data) }
      );
    }

    return user;
  }

  /**
   * Soft delete user
   */
  async softDeleteUser(id: string, auditUserId?: string): Promise<any> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prevent deleting superadmin
    if (existingUser.isSuperadmin) {
      throw new Error('Cannot delete superadmin user');
    }

    // Soft delete user
    const user = await this.userRepository.softDelete(id);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'USER_DELETED',
        '127.0.0.1',
        { userId: user.id, email: user.email }
      );
    }

    return user;
  }

  /**
   * Hard delete user (admin only)
   */
  async deleteUser(id: string, auditUserId?: string): Promise<any> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prevent deleting superadmin
    if (existingUser.isSuperadmin) {
      throw new Error('Cannot delete superadmin user');
    }

    // Delete user
    const user = await this.userRepository.delete(id);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'USER_HARD_DELETED',
        '127.0.0.1',
        { userId: user.id, email: user.email }
      );
    }

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    data: ChangePasswordInput
  ): Promise<void> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(
      data.newPassword,
      env.BCRYPT_ROUNDS
    );

    // Update password
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });

    // Log password change
    await this.auditRepository.logUserAction(
      userId,
      user.tenantId,
      'PASSWORD_CHANGED',
      '127.0.0.1',
      { userId }
    );
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    auditUserId?: string
  ): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Assign role
    await this.userRepository.assignRole(userId, roleId);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'ROLE_ASSIGNED',
        '127.0.0.1',
        { userId, roleId }
      );
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(
    userId: string,
    roleId: string,
    auditUserId?: string
  ): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove role
    await this.userRepository.removeRole(userId, roleId);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'ROLE_REMOVED',
        '127.0.0.1',
        { userId, roleId }
      );
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<any[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.userRepository.getUserRoles(userId);
  }

  /**
   * Get user statistics
   */
  async getUserStats(tenantId?: string): Promise<any> {
    const filters: UserFilters = {};
    if (tenantId) {
      filters.tenantId = tenantId;
    }

    const [totalUsers, activeUsers, superadmins] = await Promise.all([
      this.userRepository.count(filters),
      this.userRepository.count({ ...filters, isActive: true }),
      this.userRepository.count({ ...filters, isSuperadmin: true }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      superadmins,
      regularUsers: totalUsers - superadmins,
    };
  }
}
