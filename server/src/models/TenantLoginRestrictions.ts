import { Model, DataTypes, Sequelize } from "sequelize";
import { TenantLoginRestrictions as TenantLoginRestrictionsInterface } from "@/interfaces";
import { TENANT_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class TenantLoginRestrictions
    extends Model<TenantLoginRestrictionsInterface>
    implements TenantLoginRestrictionsInterface
  {
    public id!: number;
    public max_devices!: number;
    public allow_multiple_sessions!: boolean;
    public password_expiry_days?: number;
    public ip_whitelist?: string;
    public default_for_tenants!: boolean;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      tenants: any;
    };

    static associate(models: any) {
      // Define associations here
      TenantLoginRestrictions.hasMany(models.Tenant, {
        foreignKey: "login_restrictions_id",
        as: "tenants",
      });
    }
  }

  TenantLoginRestrictions.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      max_devices: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue:
          TENANT_CONSTANTS.DEFAULT_TENANT_LOGIN_RESTRICTIONS.max_devices,
        validate: {
          min: TENANT_CONSTANTS.MIN_DEVICES,
          max: TENANT_CONSTANTS.MAX_DEVICES,
        },
      },
      allow_multiple_sessions: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      password_expiry_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 365,
        },
      },
      ip_whitelist: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue("ip_whitelist");
          return value ? JSON.parse(value) : null;
        },
        set(value: string[] | null) {
          this.setDataValue(
            "ip_whitelist",
            value ? JSON.stringify(value) : null
          );
        },
        validate: {
          isValidIpList(value: string | null) {
            if (value) {
              try {
                const ips = JSON.parse(value);
                if (!Array.isArray(ips)) {
                  throw new Error("IP whitelist must be an array");
                }
                // Basic IP validation
                const ipRegex =
                  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                for (const ip of ips) {
                  if (typeof ip !== "string" || !ipRegex.test(ip)) {
                    throw new Error(`Invalid IP address: ${ip}`);
                  }
                }
              } catch (error) {
                throw new Error("Invalid IP whitelist format");
              }
            }
          },
        },
      },
      default_for_tenants: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: "tenant_login_restrictions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_tenant_login_restrictions_default",
          fields: ["default_for_tenants"],
        },
        {
          name: "idx_tenant_login_restrictions_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (restrictions: TenantLoginRestrictions) => {
          // Ensure only one default restriction exists
          if (restrictions.default_for_tenants) {
            // This will be handled in the service layer
          }
        },
        beforeUpdate: (restrictions: TenantLoginRestrictions) => {
          // Additional validation or processing before update
        },
      },
    }
  );

  return TenantLoginRestrictions;
};
