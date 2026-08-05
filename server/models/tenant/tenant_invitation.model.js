  import mongoose from "mongoose";

  const tenant_invitation_schema = new mongoose.Schema(
    {
      basic_details: {
        first_name: {
          type: String,
          required: true,
        },
        last_name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        phone_number: {
          type: String,
        },
      },
      property_and_unit: {
        property: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "property",
          required: true,
        },
        unit: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
      },
      lease_terms: {
        start_date: {
          type: Date,
        },
        duration: {
          type: String,
          required: true,
        },
        monthly_rent: {
          type: Number,
          required: true,
        },
        security_deposit: {
          type: Number,
        },
      },
      invitation_setup: {
        message: {
          type: String,
        },
        expires_in: {
          type: String,
        },
        additional: {
          auto_reminders: {
            type: Boolean,
            default: false,
          },
          include_virtual_tour: {
            type: Boolean,
            default: false,
          },
          require_kyc: {
            type: Boolean,
            default: false,
          },
          send_welcome_package: {
            type: Boolean,
            default: false,
          },
        },
      },
    },
    {
      timestamps: true,
    },
  );

  const tenant_invitation_model = mongoose.model(
    "tenant_invitation",
    tenant_invitation_schema,
  );

  export default tenant_invitation_model;
