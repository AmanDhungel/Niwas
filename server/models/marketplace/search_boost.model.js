import mongoose from "mongoose";

const search_boost_schema = new mongoose.Schema(
  {
    boost_type: {
      type: String,
      required: true,
      enum: [
        "specific_property",
        "specific_owner",
        "property_type",
        "location_based",
        "all_listings",
      ],
    },
    target_property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
    },
    target_owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "owner",
    },
    target_name_or_id: {
      type: String,
    },
    boost_multiplier: {
      type: String,
      required: true,
      enum: [
        "1.2x_subtle_boost",
        "1.5x_medium_boost",
        "2.0x_strong_boost",
        "3.0x_maximum_boost",
      ],
    },
    multiplier_value: {
      type: Number,
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    boost_status: {
      type: String,
      enum: ["active", "scheduled", "expired", "cancelled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  },
);

search_boost_schema.pre("validate", function (next) {
  this.target_property = this.target_property || null;
  this.target_owner = this.target_owner || null;
  next();
});

const normalize_docs = (docs) => {
  if (!docs) return;
  const list = Array.isArray(docs) ? docs : [docs];
  list.forEach((doc) => {
    if (!doc) return;
    doc.target_property = doc.target_property ?? null;
    doc.target_owner = doc.target_owner ?? null;
  });
};

search_boost_schema.post("find", function (docs) {
  normalize_docs(docs);
});

search_boost_schema.post("findOne", function (doc) {
  normalize_docs(doc);
});

search_boost_schema.post("findOneAndUpdate", function (doc) {
  normalize_docs(doc);
});

const search_boost_model = mongoose.model("search_boost", search_boost_schema);

export default search_boost_model;