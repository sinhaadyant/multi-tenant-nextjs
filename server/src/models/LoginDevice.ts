import { Model, DataTypes, Sequelize } from "sequelize";
import { LoginDevice as LoginDeviceInterface } from "@/interfaces";

export default (sequelize: Sequelize) => {
  class LoginDevice
    extends Model<LoginDeviceInterface>
    implements LoginDeviceInterface
  {
    public id!: number;
    public user_id!: number;
    public device_info!: string;
    public ip_address!: string;
    public last_active_at!: Date;
    public is_active!: boolean;
    public created_at!: Date;

    // Associations
    public static associations: {
      user: any;
    };

    static associate(models: any) {
      // Define associations here
      LoginDevice.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  LoginDevice.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      device_info: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const value = this.getDataValue("device_info");
          return value ? JSON.parse(value) : null;
        },
        set(value: any) {
          this.setDataValue("device_info", JSON.stringify(value));
        },
        validate: {
          isValidDeviceInfo(value: string) {
            try {
              const deviceInfo = JSON.parse(value);
              if (typeof deviceInfo !== "object") {
                throw new Error("Device info must be an object");
              }
            } catch (error) {
              throw new Error("Invalid device info format");
            }
          },
        },
      },
      ip_address: {
        type: DataTypes.STRING(45), // IPv6 compatible
        allowNull: false,
        validate: {
          isIP: true,
        },
      },
      last_active_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
    },
    {
      sequelize,
      tableName: "login_devices",
      underscored: true,
      timestamps: false, // Only created_at, no updated_at
      indexes: [
        {
          name: "idx_login_devices_user_id",
          fields: ["user_id"],
        },
        {
          name: "idx_login_devices_ip_address",
          fields: ["ip_address"],
        },
        {
          name: "idx_login_devices_is_active",
          fields: ["is_active"],
        },
        {
          name: "idx_login_devices_last_active_at",
          fields: ["last_active_at"],
        },
        {
          name: "idx_login_devices_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (loginDevice: LoginDevice) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (loginDevice: LoginDevice) => {
          // Update last_active_at when device is updated
          if (loginDevice.changed("is_active") && loginDevice.is_active) {
            loginDevice.last_active_at = new Date();
          }
        },
      },
    }
  );

  return LoginDevice;
};
