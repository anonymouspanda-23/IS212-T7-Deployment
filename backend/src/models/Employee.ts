import { Role } from "@/helpers";
import mongoose from "mongoose";

export interface LoginBody {
  staffEmail: string;
  staffPassword: string;
}

export interface IEmployee {
  staffId: number;
  staffFName: string;
  staffLName: string;
  dept: string;
  position: string;
  country: string;
  email: string;
  hashedPassword: string;
  reportingManager: number;
  reportingManagerName: string;
  tempReportingManager: number | null;
  tempReportingManagerName: string | null;
  role: Role;
}

const Schema = mongoose.Schema;
const EmployeeSchema = new Schema<IEmployee>(
  {
    staffId: { type: Number, unique: true, required: true },
    staffFName: { type: String, required: true },
    staffLName: { type: String, required: true },
    dept: { type: String, required: true },
    position: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true },
    hashedPassword: { type: String, required: true },
    reportingManager: {
      type: Number,
      ref: "Employee",
      required: false,
    },
    reportingManagerName: { type: String, required: true },
    tempReportingManager: {
      type: Number,
      ref: "Employee",
      required: false,
    },
    tempReportingManagerName: { type: String, required: false },
    role: { type: Number, required: true, enum: [1, 2, 3] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

EmployeeSchema.index({ staffId: 1 }, { unique: true });

export default mongoose.model<IEmployee>("Employee", EmployeeSchema);
