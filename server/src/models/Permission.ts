import { Model, DataTypes, Sequelize } from "sequelize";
import { Permission as PermissionInterface } from "@/interfaces";

export default (sequelize: Sequelize) => {
  class Permission
    extends Model<PermissionInterface>
    implements PermissionInterface
  {
    public id!: number;
    public role_id!: number;
    public module_id!: number;
    public can_create!: boolean;
    public can_read!: boolean;
    public can_update!: boolean;
    public can_delete!: boolean;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      role: any;
      module: any;
    };

    static associate(models: any) {
      // Define associations here
      Permission.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });

      Permission.belongsTo(models.Module, {
        foreignKey: "module_id",
        as: "module",
      });
    }
  }

  Permission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      module_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "modules",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      can_create: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_update: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      can_delete: {
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
      tableName: "permissions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_permissions_role_id",
          fields: ["role_id"],
        },
        {
          name: "idx_permissions_module_id",
          fields: ["module_id"],
        },
        {
          name: "idx_permissions_role_module_unique",
          unique: true,
          fields: ["role_id", "module_id"],
        },
        {
          name: "idx_permissions_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (permission: Permission) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (permission: Permission) => {
          // Additional validation or processing before update
        },
      },
    }
  );

  return Permission;
};
