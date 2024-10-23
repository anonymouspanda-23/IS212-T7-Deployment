import { RequestType, Status } from "@/helpers";
import { Counter, initializeCounter } from "@/helpers/counter";
import mongoose from "mongoose";

export interface IRequest {
  requestId: number;
  staffId: number;
  staffName: string;
  reportingManager: number | null;
  managerName: string;
  dept: string;
  requestedDate: Date;
  requestType: RequestType;
  position: string;
  reason: string;
  initiatedWithdrawal: boolean;
  status: Status;
}

const Schema = mongoose.Schema;
initializeCounter("requestId").catch(console.error);

const RequestSchema = new Schema<IRequest>(
  {
    requestId: { type: Number, unique: true },
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
    requestedDate: { type: Date, required: true },
    requestType: { type: String, required: true },
    position: { type: String, required: false },
    reason: { type: String, required: true },
    initiatedWithdrawal: { type: Boolean, required: false },
    status: {
      type: String,
      required: true,
      enum: [
        Status.PENDING,
        Status.APPROVED,
        Status.REJECTED,
        Status.CANCELLED,
        Status.WITHDRAWN,
        Status.REVOKED,
      ],
      default: Status.PENDING,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

RequestSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      "requestId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.requestId = counter.seq;
  }
  next();
});

RequestSchema.index({ requestId: 1 }, { unique: true });
export default mongoose.model<IRequest>("Request", RequestSchema);
