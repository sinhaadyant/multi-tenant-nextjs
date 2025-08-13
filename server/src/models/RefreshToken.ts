import { Model, DataTypes, Sequelize } from "sequelize";
import { RefreshToken as RefreshTokenInterface } from "@/interfaces";

export default (sequelize: Sequelize) => {
  class RefreshToken
    extends Model<RefreshTokenInterface>
    implements RefreshTokenInterface
  {
    public id!: number;
    public user_id!: number;
    public token!: string;
    public expires_at!: Date;
    public created_at!: Date;

    // Associations
    public static associations: {
      user: any;
    };

    static associate(models: any) {
      // Define associations here
      RefreshToken.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  RefreshToken.init(
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
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          len: [1, 255],
        },
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "refresh_tokens",
      underscored: true,
      timestamps: false, // Only created_at, no updated_at
      indexes: [
        {
          name: "idx_refresh_tokens_user_id",
          fields: ["user_id"],
        },
        {
          name: "idx_refresh_tokens_token",
          unique: true,
          fields: ["token"],
        },
        {
          name: "idx_refresh_tokens_expires_at",
          fields: ["expires_at"],
        },
        {
          name: "idx_refresh_tokens_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (refreshToken: RefreshToken) => {
          // Additional validation or processing before creation
        },
      },
    }
  );

  return RefreshToken;
};
