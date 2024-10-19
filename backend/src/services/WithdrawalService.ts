import RequestService from "./RequestService";
import { IWithdrawal } from "@/models/Withdrawal";
import ReassignmentService from "./ReassignmentService";
import { HttpStatusResponse, Request, Action, Dept } from "@/helpers";
import {
  checkPastWithdrawalDate,
  checkValidWithdrawalDate,
} from "@/helpers/date";
import LogService from "./LogService";
import WithdrawalDb from "@/database/WithdrawalDb";
import EmployeeService from "./EmployeeService";

class WithdrawalService {
  private logService: LogService;
  private withdrawalDb: WithdrawalDb;
  private requestService: RequestService;
  private reassignmentService: ReassignmentService;
  private employeeService: EmployeeService;

  constructor(
    logService: LogService,
    withdrawalDb: WithdrawalDb,
    requestService: RequestService,
    reassignmentService: ReassignmentService,
    employeeService: EmployeeService,
  ) {
    this.logService = logService;
    this.withdrawalDb = withdrawalDb;
    this.requestService = requestService;
    this.reassignmentService = reassignmentService;
    this.employeeService = employeeService;
  }

  public async getWithdrawalRequest(requestId: number) {
    const request = await this.withdrawalDb.getWithdrawalRequest(
      Number(requestId),
    );
    if (request.length < 1) {
      return null;
    }
    return request;
  }

  public async withdrawRequest(requestId: number): Promise<string | null> {
    const request = await this.requestService.getApprovedRequestByRequestId(
      Number(requestId),
    );
    if (!request) {
      return null;
    }
    const withdrawals = await this.getWithdrawalRequest(Number(requestId));

    if (withdrawals) {
      const hasNoApprovedOrPending = withdrawals.every(
        (obj) => obj.status !== "APPROVED" && obj.status !== "PENDING",
      );
      if (!hasNoApprovedOrPending) {
        return null;
      }
    }

    const {
      staffId,
      staffName,
      reportingManager,
      managerName,
      dept,
      position,
      requestedDate,
    } = request!;

    if (
      checkPastWithdrawalDate(requestedDate) &&
      !checkValidWithdrawalDate(requestedDate)
    ) {
      return null;
    }

    const document = {
      requestId: requestId,
      staffId: staffId,
      staffName: staffName,
      reportingManager,
      managerName,
      dept,
      position,
    };
    const result = await this.withdrawalDb.withdrawRequest(document);
    if (!result) {
      return null;
    }
    await this.logService.logRequestHelper({
      performedBy: staffId,
      requestType: Request.WITHDRAWAL,
      action: Action.APPLY,
      dept: dept as Dept,
      position: position,
      requestId: requestId,
      staffName: staffName,
      reportingManagerId: reportingManager as any,
      managerName: managerName,
    });
    return HttpStatusResponse.OK;
  }

  public async getSubordinatesWithdrawalRequests(
    staffId: number,
    shouldLog: boolean = true,
  ): Promise<IWithdrawal[]> {
    const subordinatesRequests =
      await this.withdrawalDb.getSubordinatesWithdrawalRequests(
        Number(staffId),
      );

    const activeReassignment =
      await this.reassignmentService.getActiveReassignmentAsTempManager(
        staffId,
      );

    let combinedRequests = subordinatesRequests;

    if (activeReassignment && activeReassignment.active) {
      const tempSubordinatesRequests =
        await this.getSubordinatesWithdrawalRequests(
          Number(activeReassignment.staffId),
          false,
        );
      combinedRequests = [
        ...subordinatesRequests,
        ...tempSubordinatesRequests,
      ] as any;
    }
    if (shouldLog && combinedRequests.length > 0) {
      const managerDetails = await this.employeeService.getEmployee(staffId);
      if (managerDetails) {
        await this.logService.logRequestHelper({
          performedBy: staffId,
          requestType: Request.WITHDRAWAL,
          action: Action.RETRIEVE,
          staffName: `${managerDetails.staffFName} ${managerDetails.staffLName}`,
          dept: managerDetails.dept as Dept,
          position: managerDetails.position,
        });
      }
    }
    return combinedRequests;
  }

  public async getOwnWithdrawalRequests(
    staffId: number,
  ): Promise<IWithdrawal[]> {
    const ownRequests =
      await this.withdrawalDb.getOwnWithdrawalRequests(staffId);
    if (ownRequests && ownRequests.length > 0) {
      await this.logService.logRequestHelper({
        performedBy: staffId,
        requestType: Request.WITHDRAWAL,
        action: Action.RETRIEVE,
        staffName: ownRequests[0].staffName,
        dept: ownRequests[0].dept as Dept,
        position: ownRequests[0].position,
        reportingManagerId: ownRequests[0].reportingManager as any,
        managerName: ownRequests[0].managerName as any,
      });
    }
    return ownRequests;
  }
}
export default WithdrawalService;
