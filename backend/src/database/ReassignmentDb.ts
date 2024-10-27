import { Status } from "@/helpers";
import Reassignment from "@/models/Reassignment";
import dayjs from "dayjs";

class ReassignmentDb {
  public async setActiveReassignmentPeriod(): Promise<boolean> {
    const now = dayjs().utc(true).startOf("day");
    const { modifiedCount } = await Reassignment.updateMany(
      {
        startDate: { $eq: now.toDate() },
      },
      {
        $set: {
          active: true,
        },
      },
    );

    return modifiedCount > 0;
  }

  public async setInactiveReassignmentPeriod(): Promise<boolean> {
    const now = dayjs().utc(true).startOf("day");
    const { modifiedCount } = await Reassignment.updateMany(
      {
        endDate: { $lt: now.toDate() },
      },
      {
        $set: {
          active: false,
        },
      },
    );

    return modifiedCount > 0;
  }

  public async insertReassignmentRequest(
    reassignmentRequest: any,
  ): Promise<void> {
    await Reassignment.create(reassignmentRequest);
  }

  public async getReassignmentRequest(staffId: number) {
    const reassignmentRequest = await Reassignment.find(
      {
        staffId,
      },
      "-_id -createdAt -updatedAt",
    );
    return reassignmentRequest;
  }

  public async getTempMgrReassignmentRequest(staffId: number) {
    const reassignmentRequest = await Reassignment.find(
      {
        tempReportingManagerId: staffId,
      },
      "-_id -createdAt -updatedAt",
    );
    return reassignmentRequest;
  }

  public async getReassignmentActive(
    staffId: number,
    tempReportingManagerId: number,
  ) {
    const reassignmentRequest = await Reassignment.findOne(
      {
        staffId,
        tempReportingManagerId,
        active: true,
      },
      "-_id -createdAt -updatedAt",
    );
    return reassignmentRequest;
  }

  public async hasNonRejectedReassignment(
    staffId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const hasNonRejectedReassignment = await Reassignment.exists({
      staffId,
      status: { $ne: Status.REJECTED },
      $or: [
        {
          startDate: { $lte: endDate, $gte: startDate },
        },
        {
          endDate: { $gte: startDate, $lte: endDate },
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate },
        },
      ],
    });

    return !!hasNonRejectedReassignment;
  }

  public async getActiveReassignmentAsTempManager(staffId: number) {
    const reassignmentRequest = await Reassignment.findOne(
      {
        tempReportingManagerId: staffId,
        active: true,
      },
      "-_id -createdAt -updatedAt",
    );
    return reassignmentRequest;
  }

  public async getIncomingReassignmentRequests(staffId: number) {
    const incomingRequests = await Reassignment.find({
      tempReportingManagerId: staffId,
      status: Status.PENDING,
    }).lean();

    return incomingRequests;
  }

  public async updateReassignmentStatus(
    reassignmentId: number,
    status: Status,
  ) {
    return Reassignment.findOneAndUpdate(
      { reassignmentId },
      { $set: { status } },
      { new: true },
    ).lean();
  }
}

export default ReassignmentDb;
