import { Model, DataTypes, Sequelize } from "sequelize";
import { Module as ModuleInterface } from "@/interfaces";
import { MODULE_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class Module extends Model<ModuleInterface> implements ModuleInterface {
    public id!: number;
    public name!: string;
    public description?: string;
    public is_active!: boolean;
    public order_index!: number;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      menus: any;
      permissions: any;
    };

    static associate(models: any) {
      // Define associations here
      Module.hasMany(models.Menu, {
        foreignKey: "module_id",
        as: "menus",
      });

      Module.hasMany(models.Permission, {
        foreignKey: "module_id",
        as: "permissions",
      });
    }
  }

  Module.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(MODULE_CONSTANTS.NAME_MAX_LENGTH),
        allowNull: false,
        unique: true,
        validate: {
          len: [
            MODULE_CONSTANTS.NAME_MIN_LENGTH,
            MODULE_CONSTANTS.NAME_MAX_LENGTH,
          ],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, MODULE_CONSTANTS.DESCRIPTION_MAX_LENGTH],
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
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
      tableName: "modules",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_modules_name",
          unique: true,
          fields: ["name"],
        },
        {
          name: "idx_modules_is_active",
          fields: ["is_active"],
        },
        {
          name: "idx_modules_order_index",
          fields: ["order_index"],
        },
        {
          name: "idx_modules_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (module: Module) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (module: Module) => {
          // Additional validation or processing before update
        },
      },
    }
  );

  return Module;
};
