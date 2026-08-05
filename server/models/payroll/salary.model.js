import mongoose from "mongoose";

const salary_schema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    net_salary: {
      type: Number,
      required: true,
    },
    expected_revenues: [
      {
        basic: {
          type: Number,
          required: true,
        },
        da: {
          type: Number,
          required: true,
        },
        hra: {
          type: Number,
          required: true,
        },
        conveyance: {
          type: Number,
          required: true,
        },
        allowance: {
          type: Number,
          required: true,
        },
        medical_allowance: {
          type: Number,
          required: true,
        },
        others: {
          type: Number,
          required: true,
        },
      },
    ],
    deductions: [
      {
        tds: {
          type: Number,
          required: true,
        },
        pf: {
          type: Number,
          required: true,
        },
        esi: {
          type: Number,
          required: true,
        },
        leave: {
          type: Number,
          required: true,
        },
        professional_tax: {
          type: Number,
          required: true,
        },
        labour_welfare_fund: {
          type: Number,
          required: true,
        },
        others: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const salary_model = mongoose.model("salary", salary_schema);

export default salary_model;
