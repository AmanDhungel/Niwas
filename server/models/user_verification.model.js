import mongoose from "mongoose";

const user_verification_schema = new mongoose.Schema({
  user_id: {
    ref: "user",
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  user_verification_token: {
    type: String,
    required: true,
  },
});

const user_verification_model = mongoose.model(
  "user_verification",
  user_verification_schema
);

export default user_verification_model;
