import { Model, DataTypes, Sequelize } from "sequelize";
import { User as UserInterface } from "@/interfaces";
import { USER_CONSTANTS, AUTH_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class User extends Model<UserInterface> implements UserInterface {
    public id!: number;
    public tenant_id!: number;
    public role_id!: number;
    public first_name!: string;
    public last_name!: string;
    public email!: string;
    public password_hash!: string;
    public is_superadmin!: boolean;
    public is_active!: boolean;
    public last_login_at?: Date;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      tenant: any;
      role: any;
      refreshTokens: any;
      resetTokens: any;
      loginDevices: any;
      supportTickets: any;
      supportReplies: any;
      auditLogs: any;
    };

    static associate(models: any) {
      // Define associations here
      User.belongsTo(models.Tenant, {
        foreignKey: "tenant_id",
        as: "tenant",
      });

      User.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });

      User.hasMany(models.RefreshToken, {
        foreignKey: "user_id",
        as: "refreshTokens",
      });

      User.hasMany(models.ResetToken, {
        foreignKey: "user_id",
        as: "resetTokens",
      });

      User.hasMany(models.LoginDevice, {
        foreignKey: "user_id",
        as: "loginDevices",
      });

      User.hasMany(models.SupportTicket, {
        foreignKey: "user_id",
        as: "supportTickets",
      });

      User.hasMany(models.SupportReply, {
        foreignKey: "user_id",
        as: "supportReplies",
      });

      User.hasMany(models.AuditLog, {
        foreignKey: "user_id",
        as: "auditLogs",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      first_name: {
        type: DataTypes.STRING(USER_CONSTANTS.NAME_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [USER_CONSTANTS.NAME_MIN_LENGTH, USER_CONSTANTS.NAME_MAX_LENGTH],
        },
      },
      last_name: {
        type: DataTypes.STRING(USER_CONSTANTS.NAME_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [USER_CONSTANTS.NAME_MIN_LENGTH, USER_CONSTANTS.NAME_MAX_LENGTH],
        },
      },
      email: {
        type: DataTypes.STRING(USER_CONSTANTS.EMAIL_MAX_LENGTH),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          len: [1, USER_CONSTANTS.EMAIL_MAX_LENGTH],
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      is_superadmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "users",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_users_email",
          unique: true,
          fields: ["email"],
        },
        {
          name: "idx_users_tenant_id",
          fields: ["tenant_id"],
        },
        {
          name: "idx_users_role_id",
          fields: ["role_id"],
        },
        {
          name: "idx_users_is_active",
          fields: ["is_active"],
        },
        {
          name: "idx_users_is_superadmin",
          fields: ["is_superadmin"],
        },
        {
          name: "idx_users_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (user: User) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (user: User) => {
          // Additional validation or processing before update
        },
      },
    }
  );

  return User;
};
