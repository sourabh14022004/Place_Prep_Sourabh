const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    tier: { type: String },
    category: { type: String },
  },
  {
    timestamps: true,
    strict: false,
    collection: "companies",
  }
);

module.exports = mongoose.model("Company", CompanySchema);
