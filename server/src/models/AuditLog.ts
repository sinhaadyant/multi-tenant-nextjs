import { Model, DataTypes, Sequelize } from "sequelize";
import { AuditLog as AuditLogInterface } from "@/interfaces";
import { AUDIT_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class AuditLog extends Model<AuditLogInterface> implements AuditLogInterface {
    public id!: number;
    public tenant_id?: number;
    public user_id?: number;
    public action!: string;
    public module!: string;
    public record_id?: number;
    public ip_address!: string;
    public old_values?: string;
    public new_values?: string;
    public created_at!: Date;

    // Associations
    public static associations: {
      tenant: any;
      user: any;
    };

    static associate(models: any) {
      // Define associations here
      AuditLog.belongsTo(models.Tenant, {
        foreignKey: "tenant_id",
        as: "tenant",
      });

      AuditLog.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  AuditLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      action: {
        type: DataTypes.STRING(AUDIT_CONSTANTS.ACTION_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [1, AUDIT_CONSTANTS.ACTION_MAX_LENGTH],
        },
      },
      module: {
        type: DataTypes.STRING(AUDIT_CONSTANTS.MODULE_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [1, AUDIT_CONSTANTS.MODULE_MAX_LENGTH],
        },
      },
      record_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(AUDIT_CONSTANTS.IP_ADDRESS_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [1, AUDIT_CONSTANTS.IP_ADDRESS_MAX_LENGTH],
        },
      },
      old_values: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue("old_values");
          return value ? JSON.parse(value) : null;
        },
        set(value: any) {
          this.setDataValue("old_values", value ? JSON.stringify(value) : null);
        },
        validate: {
          isValidJson(value: string | null) {
            if (value) {
              try {
                JSON.parse(value);
              } catch (error) {
                throw new Error("Invalid JSON format for old_values");
              }
            }
          },
        },
      },
      new_values: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue("new_values");
          return value ? JSON.parse(value) : null;
        },
        set(value: any) {
          this.setDataValue("new_values", value ? JSON.stringify(value) : null);
        },
        validate: {
          isValidJson(value: string | null) {
            if (value) {
              try {
                JSON.parse(value);
              } catch (error) {
                throw new Error("Invalid JSON format for new_values");
              }
            }
          },
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "audit_logs",
      underscored: true,
      timestamps: false, // Only created_at, no updated_at
      indexes: [
        {
          name: "idx_audit_logs_tenant_id",
          fields: ["tenant_id"],
        },
        {
          name: "idx_audit_logs_user_id",
          fields: ["user_id"],
        },
        {
          name: "idx_audit_logs_action",
          fields: ["action"],
        },
        {
          name: "idx_audit_logs_module",
          fields: ["module"],
        },
        {
          name: "idx_audit_logs_record_id",
          fields: ["record_id"],
        },
        {
          name: "idx_audit_logs_ip_address",
          fields: ["ip_address"],
        },
        {
          name: "idx_audit_logs_created_at",
          fields: ["created_at"],
        },
        {
          name: "idx_audit_logs_tenant_created_at",
          fields: ["tenant_id", "created_at"],
        },
        {
          name: "idx_audit_logs_user_created_at",
          fields: ["user_id", "created_at"],
        },
      ],
      hooks: {
        beforeCreate: (auditLog: AuditLog) => {
          // Additional validation or processing before creation
        },
      },
    }
  );

  return AuditLog;
};
