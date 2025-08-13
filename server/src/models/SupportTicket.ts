import { Model, DataTypes, Sequelize } from "sequelize";
import { SupportTicket as SupportTicketInterface } from "@/interfaces";
import { SUPPORT_CONSTANTS } from "@/constants";

export default (sequelize: Sequelize) => {
  class SupportTicket
    extends Model<SupportTicketInterface>
    implements SupportTicketInterface
  {
    public id!: number;
    public tenant_id!: number;
    public user_id!: number;
    public subject!: string;
    public status!: "open" | "in_progress" | "closed";
    public priority!: "low" | "medium" | "high";
    public created_at!: Date;
    public updated_at!: Date;

    // Associations
    public static associations: {
      tenant: any;
      user: any;
      replies: any;
      attachments: any;
    };

    static associate(models: any) {
      // Define associations here
      SupportTicket.belongsTo(models.Tenant, {
        foreignKey: "tenant_id",
        as: "tenant",
      });

      SupportTicket.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      SupportTicket.hasMany(models.SupportReply, {
        foreignKey: "ticket_id",
        as: "replies",
      });

      SupportTicket.hasMany(models.SupportAttachment, {
        foreignKey: "ticket_id",
        as: "attachments",
      });
    }
  }

  SupportTicket.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
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
      subject: {
        type: DataTypes.STRING(SUPPORT_CONSTANTS.TITLE_MAX_LENGTH),
        allowNull: false,
        validate: {
          len: [
            SUPPORT_CONSTANTS.TITLE_MIN_LENGTH,
            SUPPORT_CONSTANTS.TITLE_MAX_LENGTH,
          ],
        },
      },
      status: {
        type: DataTypes.ENUM("open", "in_progress", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: false,
        defaultValue: "medium",
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
      tableName: "support_tickets",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "idx_support_tickets_tenant_id",
          fields: ["tenant_id"],
        },
        {
          name: "idx_support_tickets_user_id",
          fields: ["user_id"],
        },
        {
          name: "idx_support_tickets_status",
          fields: ["status"],
        },
        {
          name: "idx_support_tickets_priority",
          fields: ["priority"],
        },
        {
          name: "idx_support_tickets_created_at",
          fields: ["created_at"],
        },
        {
          name: "idx_support_tickets_updated_at",
          fields: ["updated_at"],
        },
      ],
      hooks: {
        beforeCreate: (ticket: SupportTicket) => {
          // Additional validation or processing before creation
        },
        beforeUpdate: (ticket: SupportTicket) => {
          // Additional validation or processing before update
        },
      },
    }
  );

  return SupportTicket;
};
