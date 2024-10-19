import { Status } from "@/helpers";
import { Counter, initializeCounter } from "@/helpers/counter";
import mongoose from "mongoose";

export interface IWithdrawal {
  withdrawalId: number;
  requestId: number;
  staffId: number;
  staffName: string;
  reportingManager: number | null;
  managerName: string | null;
  dept: string;  
  position: string;
  reason: string | null;
  status: Status;
}

const Schema = mongoose.Schema;
initializeCounter("withdrawalId").catch(console.error);

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    withdrawalId: { type: Number, unique: true },
    requestId: {
      type: Number,
      ref: "Request",
      required: true,
    },    
    staffId: {
      type: Number,
      ref: "Employee",
      required: true,
    },
    staffName: { type: String, required: true },
    reportingManager: {
      type: Number,
      ref: "Employee",
      required: false,
    },
    managerName: { type: String, required: false },
    dept: { type: String, required: true },    
    position: { type: String, required: true },
    reason: { type: String, required: false },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: Status.PENDING,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

WithdrawalSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      "withdrawalId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.withdrawalId = counter.seq;
  }
  next();
});

WithdrawalSchema.index({ withdrawalId: 1 }, { unique: true });
export default mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema);
