import Withdrawal, { IWithdrawal } from "@/models/Withdrawal";
import { HttpStatusResponse, Status } from "@/helpers";
import dayjs from "dayjs";

interface InsertDocument {
  requestId: number;
  staffId: number;
  staffName: string;
  reportingManager: number | null;
  managerName: string | null;
  dept: string;
  position: string;
  requestedDate: Date;
  requestType: string;
}

class WithdrawalDb {
  public async withdrawRequest(
    document: InsertDocument,
  ): Promise<string | null> {
    try {
      const withdrawalInsert = await Withdrawal.create(document);
      return withdrawalInsert ? HttpStatusResponse.OK : null;
    } catch (error) {
      return null;
    }
  }

  public async getWithdrawalRequest(requestId: number): Promise<IWithdrawal[]> {
    const withdrawalRequests = await Withdrawal.find({
      requestId: requestId,
    });
    return withdrawalRequests;
  }

  public async getSubordinatesWithdrawalRequests(
    reportingManager: number,
  ): Promise<IWithdrawal[]> {
    const subordinatesRequests = await Withdrawal.find({
      reportingManager: reportingManager,
    });
    return subordinatesRequests;
  }

  public async getOwnWithdrawalRequests(
    staffId: number,
  ): Promise<IWithdrawal[]> {
    const ownRequests = await Withdrawal.find({
      staffId: staffId,
    });
    return ownRequests;
  }

  public async getWithdrawalRequestById(
    withdrawalId: number,
  ): Promise<IWithdrawal | null> {
    const withdrawalRequest = await Withdrawal.findOne({
      withdrawalId: withdrawalId,
    });
    if (!withdrawalRequest) {
      return null;
    }
    return withdrawalRequest;
  }

  public async approveWithdrawalRequest(
    withdrawalId: number,
  ): Promise<string | null> {
    const { modifiedCount } = await Withdrawal.updateMany(
      {
        withdrawalId,
        status: Status.PENDING,
      },
      {
        $set: {
          status: Status.APPROVED,
        },
      },
    );
    if (modifiedCount == 0) {
      return null;
    }
    return HttpStatusResponse.OK;
  }

  public async rejectWithdrawalRequest(
    withdrawalId: number,
    reason: string,
  ): Promise<string | null> {
    const { modifiedCount } = await Withdrawal.updateMany(
      {
        withdrawalId,
        status: Status.PENDING,
      },
      {
        $set: {
          status: Status.REJECTED,
          reason: reason,
        },
      },
    );
    if (modifiedCount == 0) {
      return null;
    }
    return HttpStatusResponse.OK;
  }

  public async updateWithdrawalStatusToExpired(): Promise<any> {
    const now = dayjs().utc(true).startOf("day");
    const withdrawalRequests = await Withdrawal.find({
      status: Status.PENDING,
      requestedDate: now.toDate(),
    });

    if (!withdrawalRequests.length) return [];

    await Withdrawal.updateMany(
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

    return withdrawalRequests;
  }
}

export default WithdrawalDb;
