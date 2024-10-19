import { Action, Request } from "@/helpers";
import { Counter, initializeCounter } from "@/helpers/counter";
import mongoose from "mongoose";

export interface ILog {
  logId: number;
  performedBy: number;
  staffName: string;
  dept: string;
  position: string;
  reportingManagerId: number;
  managerName: string;
  requestId: number | undefined;
  requestType: Request;
  action: Action;
  reason: string | null;
}

const Schema = mongoose.Schema;
initializeCounter("logId").catch(console.error);

const LogSchema = new Schema<ILog>(
  {
    logId: { type: Number, unique: true },
    performedBy: {
      type: Number,
      required: true,
    },
    staffName: { type: String, required: false },
    dept: { type: String, required: false },
    position: { type: String, required: false },
    reportingManagerId: { type: Number, required: false },
    managerName: { type: String, required: false },
    requestId: { type: Number, required: false },
    requestType: {
      type: String,
      required: true,
      enum: [Request.APPLICATION, Request.WITHDRAWAL, Request.REASSIGNMENT],
    },
    action: {
      type: String,
      required: true,
      enum: [
        Action.APPLY,
        Action.APPROVE,
        Action.RETRIEVE,
        Action.REJECT,
        Action.CANCEL,
        Action.REVOKE,
        Action.REASSIGN,
        Action.EXPIRE,
        Action.SET_INACTIVE,
        Action.SET_ACTIVE,
      ],
    },
    reason: { type: String, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

LogSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      "logId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.logId = counter.seq;
  }

  next();
});

LogSchema.index({ logId: 1 }, { unique: true });
export default mongoose.model<ILog>("Log", LogSchema);
