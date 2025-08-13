import { Model, DataTypes, Sequelize } from "sequelize";
import { Tenant as TenantInterface } from "@/interfaces";
import { TENANT_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class Tenant extends Model<TenantInterface> implements TenantInterface {
    public id!: number;
    public name!: string;
    public domain?: string;
    public contact_email!: string;
    public contact_phone?: string;
    public address?: string;
    public is_active!: boolean;
    public login_restrictions_id?: number;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      users: any;
      roles: any;
      loginRestrictions: any;
      supportTickets: any;
      auditLogs: any;
    };

    static associate(models: any) {
      // Define associations here
      Tenant.hasMany(models.User, {
        foreignKey: "tenant_id",
        as: "users",
      });

      Tenant.hasMany(models.Role, {
        foreignKey: "tenant_id",
        as: "roles",
      });

      Tenant.belongsTo(models.TenantLoginRestrictions, {
        foreignKey: "login_restrictions_id",
        as: "loginRestrictions",
      });

      Tenant.hasMany(models.SupportTicket, {
        foreignKey: "tenant_id",
        as: "supportTickets",
      });

      Tenant.hasMany(models.AuditLog, {
        foreignKey: "tenant_id",
        as: "auditLogs",
      });
    }
  }

  Tenant.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(TENANT_CONSTANTS.NAME_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [
            TENANT_CONSTANTS.NAME_MIN_LENGTH,
            TENANT_CONSTANTS.NAME_MAX_LENGTH,
          ],
        },
      },
      domain: {
        type: DataTypes.STRING(TENANT_CONSTANTS.DOMAIN_MAX_LENGTH),
        allowNull: true,
        unique: true,
        validate: {
          len: [0, TENANT_CONSTANTS.DOMAIN_MAX_LENGTH],
        },
      },
      contact_email: {
        type: DataTypes.STRING(TENANT_CONSTANTS.CONTACT_EMAIL_MAX_LENGTH),
        allowNull: false,
        validate: {
          isEmail: true,
          len: [1, TENANT_CONSTANTS.CONTACT_EMAIL_MAX_LENGTH],
        },
      },
      contact_phone: {
        type: DataTypes.STRING(TENANT_CONSTANTS.CONTACT_PHONE_MAX_LENGTH),
        allowNull: true,
        validate: {
          len: [0, TENANT_CONSTANTS.CONTACT_PHONE_MAX_LENGTH],
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, TENANT_CONSTANTS.ADDRESS_MAX_LENGTH],
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      login_restrictions_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tenant_login_restrictions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
      tableName: "tenants",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_tenants_domain",
          unique: true,
          fields: ["domain"],
          where: {
            domain: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
        {
          name: "idx_tenants_contact_email",
          fields: ["contact_email"],
        },
        {
          name: "idx_tenants_is_active",
          fields: ["is_active"],
        },
        {
          name: "idx_tenants_login_restrictions_id",
          fields: ["login_restrictions_id"],
        },
        {
          name: "idx_tenants_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (tenant: Tenant) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (tenant: Tenant) => {
          // Additional validation or processing before update
        },
      },
    }
  );

  return Tenant;
};
