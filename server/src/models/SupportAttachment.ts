import { Model, DataTypes, Sequelize } from "sequelize";
import { SupportAttachment as SupportAttachmentInterface } from "@/interfaces";

export default (sequelize: Sequelize) => {
  class SupportAttachment
    extends Model<SupportAttachmentInterface>
    implements SupportAttachmentInterface
  {
    public id!: number;
    public reply_id!: number;
    public file_path!: string;
    public file_type!: string;
    public created_at!: Date;

    // Associations
    public static associations: {
      reply: any;
    };

    static associate(models: any) {
      // Define associations here
      SupportAttachment.belongsTo(models.SupportReply, {
        foreignKey: "reply_id",
        as: "reply",
      });
    }
  }

  SupportAttachment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      reply_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "support_replies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          len: [1, 500],
        },
      },
      file_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [1, 100],
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
      tableName: "support_attachments",
      underscored: true,
      timestamps: false, // Only created_at, no updated_at
      indexes: [
        {
          name: "idx_support_attachments_reply_id",
          fields: ["reply_id"],
        },
        {
          name: "idx_support_attachments_file_type",
          fields: ["file_type"],
        },
        {
          name: "idx_support_attachments_created_at",
          fields: ["created_at"],
        },
      ],
      hooks: {
        beforeCreate: (attachment: SupportAttachment) => {
          // Additional validation or processing before creation
        },
        beforeDestroy: (attachment: SupportAttachment) => {
          // Clean up file from filesystem when attachment is deleted
          // This will be handled in the service layer
        },
      },
    }
  );

  return SupportAttachment;
};
