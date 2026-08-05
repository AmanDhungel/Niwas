import mongoose from "mongoose";

const account_category_schema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
    },
    sub_category_name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const account_category_model = mongoose.model(
  "account_category",
  account_category_schema,
);

export default account_category_model;