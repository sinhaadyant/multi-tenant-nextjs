import { Model, DataTypes, Sequelize } from "sequelize";
import { SupportReply as SupportReplyInterface } from "@/interfaces";
import { SUPPORT_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class SupportReply
    extends Model<SupportReplyInterface>
    implements SupportReplyInterface
  {
    public id!: number;
    public ticket_id!: number;
    public user_id!: number;
    public message!: string;
    public created_at!: Date;

    // Associations
    public static associations: {
      ticket: any;
      user: any;
      attachments: any;
    };

    static associate(models: any) {
      // Define associations here
      SupportReply.belongsTo(models.SupportTicket, {
        foreignKey: "ticket_id",
        as: "ticket",
      });

      SupportReply.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      SupportReply.hasMany(models.SupportAttachment, {
        foreignKey: "reply_id",
        as: "attachments",
      });
    }
  }

  SupportReply.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "support_tickets",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, SUPPORT_CONSTANTS.REPLY_MAX_LENGTH],
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
      tableName: "support_replies",
      underscored: true,
      timestamps: false, // Only created_at, no updated_at
      indexes: [
        {
          name: "idx_support_replies_ticket_id",
          fields: ["ticket_id"],
        },
        {
          name: "idx_support_replies_user_id",
          fields: ["user_id"],
        },
        {
          name: "idx_support_replies_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (reply: SupportReply) => {
          // Additional validation or processing before creation
        },
      },
    }
  );

  return SupportReply;
};
