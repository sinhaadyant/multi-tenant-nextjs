import { Model, DataTypes, Sequelize } from "sequelize";
import { Menu as MenuInterface } from "@/interfaces";
import { MODULE_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class Menu extends Model<MenuInterface> implements MenuInterface {
    public id!: number;
    public module_id!: number;
    public parent_id?: number;
    public title!: string;
    public icon?: string;
    public route_path!: string;
    public order_index!: number;
    public is_active!: boolean;
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      module: any;
      parent: any;
      children: any;
    };

    static associate(models: any) {
      // Define associations here
      Menu.belongsTo(models.Module, {
        foreignKey: "module_id",
        as: "module",
      });

      Menu.belongsTo(models.Menu, {
        foreignKey: "parent_id",
        as: "parent",
      });

      Menu.hasMany(models.Menu, {
        foreignKey: "parent_id",
        as: "children",
      });
    }
  }

  Menu.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "menus",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      title: {
        type: DataTypes.STRING(MODULE_CONSTANTS.NAME_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [1, MODULE_CONSTANTS.NAME_MAX_LENGTH],
        },
      },
      icon: {
        type: DataTypes.STRING(MODULE_CONSTANTS.ICON_MAX_LENGTH),
        allowNull: true,
        validate: {
          len: [0, MODULE_CONSTANTS.ICON_MAX_LENGTH],
        },
      },
      route_path: {
        type: DataTypes.STRING(MODULE_CONSTANTS.ROUTE_PATH_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [1, MODULE_CONSTANTS.ROUTE_PATH_MAX_LENGTH],
        },
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: "menus",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_menus_module_id",
          fields: ["module_id"],
        },
        {
          name: "idx_menus_parent_id",
          fields: ["parent_id"],
        },
        {
          name: "idx_menus_is_active",
          fields: ["is_active"],
        },
        {
          name: "idx_menus_order_index",
          fields: ["order_index"],
        },
        {
          name: "idx_menus_route_path",
          fields: ["route_path"],
        },
        {
          name: "idx_menus_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (menu: Menu) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (menu: Menu) => {
          // Additional validation or processing before update
        },
        beforeDestroy: (menu: Menu) => {
          // Handle cascading deletes for children
          // This will be handled by the database foreign key constraint
        },
      },
    }
  );

  return Menu;
};
