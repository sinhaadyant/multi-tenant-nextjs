import { Model, DataTypes, Sequelize } from "sequelize";
import { ResetToken as ResetTokenInterface } from "@/interfaces";

export default (sequelize: Sequelize) => {
  class ResetToken
    extends Model<ResetTokenInterface>
    implements ResetTokenInterface
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
      ResetToken.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  ResetToken.init(
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
      tableName: "reset_tokens",
      underscored: true,
      timestamps: false, // Only created_at, no updated_at
      indexes: [
        {
          name: "idx_reset_tokens_user_id",
          fields: ["user_id"],
        },
        {
          name: "idx_reset_tokens_token",
          unique: true,
          fields: ["token"],
        },
        {
          name: "idx_reset_tokens_expires_at",
          fields: ["expires_at"],
        },
        {
          name: "idx_reset_tokens_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (resetToken: ResetToken) => {
          // Additional validation or processing before creation
        },
      },
    }
  );

  return ResetToken;
};
