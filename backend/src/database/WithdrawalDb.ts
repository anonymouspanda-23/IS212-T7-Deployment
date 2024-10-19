import Withdrawal, { IWithdrawal } from "@/models/Withdrawal";
import { HttpStatusResponse } from "@/helpers";

interface InsertDocument {
  requestId: number;
  staffId: number;
  staffName: string;
  reportingManager: number | null;
  managerName: string | null;
  dept: string;
  position: string;
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
}

export default WithdrawalDb;
