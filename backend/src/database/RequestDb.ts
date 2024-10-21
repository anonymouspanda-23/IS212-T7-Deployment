import { HttpStatusResponse, RequestType, Status } from "@/helpers";
import Request, { IRequest } from "@/models/Request";
import dayjs from "dayjs";

interface InsertDocument {
  staffId: number;
  staffName: string;
  reportingManager: number;
  managerName: string;
  dept: string;
  requestedDate: Date;
  requestType: RequestType;
  reason: string;
  position: string;
}

class RequestDb {
  public async getMySchedule(myId: number): Promise<IRequest[]> {
    const schedule = await Request.find({ staffId: myId }, "-_id -updatedAt");
    return schedule;
  }

  public async getAllSubordinatesRequests(
    staffId: number,
  ): Promise<IRequest[]> {
    const subordinatesRequests = await Request.find({
      reportingManager: staffId,
    });
    return subordinatesRequests;
  }

  public async getOwnPendingRequests(myId: number): Promise<IRequest[]> {
    const pendingRequests = await Request.find({
      staffId: myId,
      status: Status.PENDING,
    });
    return pendingRequests;
  }

  public async updateRequestinitiatedWithdrawalValue(
    requestId: number,
  ): Promise<boolean> {
    const { modifiedCount } = await Request.updateOne(
      { requestId, initiatedWithdrawal: false },
      { $set: { initiatedWithdrawal: true } },
    );

    return modifiedCount > 0;
  }

  public async cancelPendingRequests(
    staffId: number,
    requestId: number,
  ): Promise<string | null> {
    const { modifiedCount } = await Request.updateMany(
      {
        staffId,
        requestId,
        status: Status.PENDING,
      },
      {
        $set: {
          status: Status.CANCELLED,
        },
      },
    );

    if (modifiedCount == 0) {
      return null;
    }

    return HttpStatusResponse.OK;
  }

  public async getPendingOrApprovedRequests(myId: number) {
    const schedule = await Request.find({
      staffId: myId,
      status: {
        $nin: [
          Status.CANCELLED,
          Status.WITHDRAWN,
          Status.REJECTED,
          Status.EXPIRED,
          Status.REVOKED,
        ],
      },
    });

    return schedule;
  }

  public async getTeamSchedule(reportingManager: number, position: string) {
    const teamSchedule = await Request.find(
      {
        reportingManager,
        position,
        status: Status.APPROVED,
      },
      "-_id -createdAt -updatedAt",
    );
    return teamSchedule;
  }

  public async getAllDeptSchedule() {
    const deptSchedule = await Request.aggregate([
      {
        $match: {
          status: Status.APPROVED,
        },
      },
      {
        $project: {
          _id: 0,
          staffId: 1,
          staffName: 1,
          reportingManager: 1,
          managerName: 1,
          dept: 1,
          requestedDate: 1,
          requestType: 1,
          position: 1,
          reason: 1,
          status: 1,
          requestId: 1,
          performedBy: 1,
        },
      },
      {
        $group: {
          _id: "$dept",
          requests: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          dept: "$_id",
          requests: 1,
        },
      },
    ]);

    const formattedSchedule = deptSchedule.reduce((acc: any, dept: any) => {
      acc[dept.dept] = dept.requests;
      return acc;
    }, {});

    return formattedSchedule;
  }

  public async postRequest(
    document: InsertDocument,
  ): Promise<boolean | number> {
    try {
      const { requestId } = await Request.create(document);
      return requestId;
    } catch (error) {
      return false;
    }
  }

  public async updateRequestStatusToExpired(): Promise<any> {
    const now = dayjs().utc(true).startOf("day");
    const requests = await Request.find({
      status: Status.PENDING,
      requestedDate: now.toDate(),
    });

    if (!requests.length) return [];

    await Request.updateMany(
      {
        status: Status.PENDING,
        requestedDate: now.toDate(),
      },
      {
        $set: {
          status: Status.EXPIRED,
        },
      },
    );

    return requests;
  }

  public async approveRequest(
    performedBy: number,
    requestId: number,
  ): Promise<string | null> {
    const { modifiedCount } = await Request.updateMany(
      {
        requestId,
        status: Status.PENDING,
      },
      {
        $set: {
          status: Status.APPROVED,
          performedBy: performedBy,
        },
      },
    );
    if (modifiedCount == 0) {
      return null;
    }
    return HttpStatusResponse.OK;
  }

  public async getPendingRequestByRequestId(requestId: number) {
    const requestDetail = await Request.findOne(
      {
        requestId,
        status: Status.PENDING,
      },
      "-_id -createdAt -updatedAt",
    );
    return requestDetail;
  }

  public async rejectRequest(
    performedBy: number,
    requestId: number,
    reason: string,
  ): Promise<string | null> {
    const { modifiedCount } = await Request.updateMany(
      {
        requestId,
        status: Status.PENDING,
      },
      {
        $set: {
          status: Status.REJECTED,
          reason: reason,
          performedBy: performedBy,
        },
      },
    );
    if (modifiedCount == 0) {
      return null;
    }
    return HttpStatusResponse.OK;
  }

  public async getApprovedRequestByRequestId(requestId: number) {
    const requestDetail = await Request.findOne(
      {
        requestId,
        status: Status.APPROVED,
      },
      "-_id -createdAt -updatedAt",
    );
    return requestDetail;
  }

  public async revokeRequest(
    requestId: number,
    reason: string,
  ): Promise<string | null> {
    const { modifiedCount } = await Request.updateMany(
      {
        requestId,
        status: Status.APPROVED,
      },
      {
        $set: {
          status: Status.REVOKED,
          reason: reason,
        },
      },
    );
    if (modifiedCount == 0) {
      return null;
    }
    return HttpStatusResponse.OK;
  }

  public async setWithdrawnStatus(requestId: number): Promise<string | null> {
    const { modifiedCount } = await Request.updateMany(
      {
        requestId,
        status: Status.APPROVED,
      },
      {
        $set: {
          status: Status.WITHDRAWN,
        },
      },
    );
    if (modifiedCount == 0) {
      return null;
    }
    return HttpStatusResponse.OK;
  }
}

export default RequestDb;
