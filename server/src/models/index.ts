import { Sequelize } from "sequelize";
import { ENV } from "@/environment";
import { logger } from "@/libraries/logger";

// Import all models
import User from "./User";
import Tenant from "./Tenant";
import TenantLoginRestrictions from "./TenantLoginRestrictions";
import Role from "./Role";
import Module from "./Module";
import Menu from "./Menu";
import Permission from "./Permission";
import RefreshToken from "./RefreshToken";
import ResetToken from "./ResetToken";
import LoginDevice from "./LoginDevice";
import SupportTicket from "./SupportTicket";
import SupportReply from "./SupportReply";
import SupportAttachment from "./SupportAttachment";
import AuditLog from "./AuditLog";

// Database configuration
const sequelize = new Sequelize({
  dialect: "mysql",
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  username: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  logging: ENV.ENABLE_LOGGING
    ? (msg: string) => logger.debug(msg, "DATABASE")
    : false,
  timezone: "+00:00",
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: ENV.DB_POOL_MAX,
    min: ENV.DB_POOL_MIN,
    acquire: ENV.DB_POOL_ACQUIRE,
    idle: ENV.DB_POOL_IDLE,
  },
});

// Initialize all models
const models = {
  User: User(sequelize),
  Tenant: Tenant(sequelize),
  TenantLoginRestrictions: TenantLoginRestrictions(sequelize),
  Role: Role(sequelize),
  Module: Module(sequelize),
  Menu: Menu(sequelize),
  Permission: Permission(sequelize),
  RefreshToken: RefreshToken(sequelize),
  ResetToken: ResetToken(sequelize),
  LoginDevice: LoginDevice(sequelize),
  SupportTicket: SupportTicket(sequelize),
  SupportReply: SupportReply(sequelize),
  SupportAttachment: SupportAttachment(sequelize),
  AuditLog: AuditLog(sequelize),
};

// Set up associations
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Database connection and sync
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info("Database connection established successfully", "DATABASE");

    // Sync database in development/test mode
    if (ENV.NODE_ENV === "development" || ENV.NODE_ENV === "test") {
      if (ENV.TEST_DB_SYNC) {
        await sequelize.sync({ force: true });
        logger.info("Database synced successfully", "DATABASE");
      } else {
        await sequelize.sync({ alter: true });
        logger.info("Database synced with alterations", "DATABASE");
      }
    }
  } catch (error) {
    logger.error(
      "Database initialization failed",
      "DATABASE",
      undefined,
      error as Error
    );
    throw error;
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info("Database connection closed successfully", "DATABASE");
  } catch (error) {
    logger.error(
      "Error closing database connection",
      "DATABASE",
      undefined,
      error as Error
    );
  }
};

// Export models and sequelize instance
export { sequelize };
export default models;
