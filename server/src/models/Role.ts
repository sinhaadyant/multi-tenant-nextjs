import { Model, DataTypes, Sequelize } from "sequelize";
import { Role as RoleInterface } from "@/interfaces";
import { ROLE_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class Role extends Model<RoleInterface> implements RoleInterface {
    public id!: number;
    public tenant_id?: number;
    public name!: string;
    public description?: string;
    public is_system!: boolean;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      tenant: any;
      users: any;
      permissions: any;
    };

    static associate(models: any) {
      // Define associations here
      Role.belongsTo(models.Tenant, {
        foreignKey: "tenant_id",
        as: "tenant",
      });

      Role.hasMany(models.User, {
        foreignKey: "role_id",
        as: "users",
      });

      Role.hasMany(models.Permission, {
        foreignKey: "role_id",
        as: "permissions",
      });
    }
  }

  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // null for global roles
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING(ROLE_CONSTANTS.NAME_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [ROLE_CONSTANTS.NAME_MIN_LENGTH, ROLE_CONSTANTS.NAME_MAX_LENGTH],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, ROLE_CONSTANTS.DESCRIPTION_MAX_LENGTH],
        },
      },
      is_system: {
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
      tableName: "roles",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_roles_tenant_id",
          fields: ["tenant_id"],
        },
        {
          name: "idx_roles_name",
          fields: ["name"],
        },
        {
          name: "idx_roles_is_system",
          fields: ["is_system"],
        },
        {
          name: "idx_roles_created_at",
          fields: ["created_at"],
        },
        {
          name: "idx_roles_tenant_name_unique",
          unique: true,
          fields: ["tenant_id", "name"],
          where: {
            tenant_id: {
              [sequelize.Sequelize.Op.ne]: null,
            },
          },
        },
      ],
      hooks: {
        beforeCreate: (role: Role) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (role: Role) => {
          // Prevent updating system roles
          if (role.is_system && role.changed("is_system")) {
            throw new Error("Cannot modify system roles");
          }
        },
        beforeDestroy: (role: Role) => {
          // Prevent deleting system roles
          if (role.is_system) {
            throw new Error("Cannot delete system roles");
          }
        },
      },
    }
  );

  return Role;
};
