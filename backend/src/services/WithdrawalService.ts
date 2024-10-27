import WithdrawalDb from "@/database/WithdrawalDb";
import {
  Action,
  Dept,
  HttpStatusResponse,
  PerformedBy,
  Request,
  Status,
} from "@/helpers";
import {
  checkPastWithdrawalDate,
  checkValidWithdrawalDate,
} from "@/helpers/date";
import { IWithdrawal } from "@/models/Withdrawal";
import EmployeeService from "./EmployeeService";
import LogService from "./LogService";
import ReassignmentService from "./ReassignmentService";
import RequestService from "./RequestService";
import dayjs from "dayjs";
import NotificationService from "./NotificationService";

class WithdrawalService {
  private logService: LogService;
  private withdrawalDb: WithdrawalDb;
  private requestService: RequestService;
  private reassignmentService: ReassignmentService;
  private employeeService: EmployeeService;
  private notificationService: NotificationService;

  constructor(
    logService: LogService,
    withdrawalDb: WithdrawalDb,
    requestService: RequestService,
    reassignmentService: ReassignmentService,
    employeeService: EmployeeService,
    notificationService: NotificationService,
  ) {
    this.logService = logService;
    this.withdrawalDb = withdrawalDb;
    this.requestService = requestService;
    this.reassignmentService = reassignmentService;
    this.employeeService = employeeService;
    this.notificationService = notificationService;
  }

  public async getWithdrawalRequest(requestId: number) {
    const request = await this.withdrawalDb.getWithdrawalRequest(
      Number(requestId),
    );
    if (!request || request.length < 1) {
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
      requestType,
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
      requestedDate,
      requestType,
    };
    const result = await this.withdrawalDb.withdrawRequest(document);

    if (!result) {
      return null;
    }

    // Update original request initiatedWithdrawal boolean to true
    await this.requestService.updateRequestinitiatedWithdrawalValue(requestId);

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

  public async getWithdrawalRequestById(withdrawalId: number) {
    const request = await this.withdrawalDb.getWithdrawalRequestById(
      Number(withdrawalId),
    );
    if (!request) {
      return null;
    }
    return request;
  }

  public async approveWithdrawalRequest(
    performedBy: number,
    withdrawalId: number,
  ): Promise<string | null> {
    const request = await this.getWithdrawalRequestById(withdrawalId);
    if (!request || request.status !== Status.PENDING) {
      return null;
    }

    if (performedBy !== request.reportingManager) {
      const activeReassignment =
        await this.reassignmentService.getReassignmentActive(
          request.reportingManager as any,
          performedBy,
        );
      if (!activeReassignment) {
        return null;
      }
    }
    const withdrawalApproval =
      await this.withdrawalDb.approveWithdrawalRequest(withdrawalId);
    if (!withdrawalApproval) {
      return null;
    }
    const result = this.requestService.setWithdrawnStatus(request.requestId);
    if (!result) {
      return null;
    }
    const managerDetails = await this.employeeService.getEmployee(performedBy);
    if (managerDetails) {
      await this.logService.logRequestHelper({
        performedBy: performedBy,
        requestType: Request.WITHDRAWAL,
        action: Action.APPROVE,
        staffName: `${managerDetails.staffFName} ${managerDetails.staffLName}`,
        dept: managerDetails.dept as Dept,
        position: managerDetails.position,
        requestId: withdrawalId,
      });
    }
    return HttpStatusResponse.OK;
  }

  public async rejectWithdrawalRequest(
    performedBy: number,
    withdrawalId: number,
    reason: string,
  ): Promise<string | null> {
    const request = await this.getWithdrawalRequestById(withdrawalId);
    if (!request || request.status !== Status.PENDING) {
      return null;
    }

    if (performedBy !== request.reportingManager) {
      const activeReassignment =
        await this.reassignmentService.getReassignmentActive(
          request.reportingManager as any,
          performedBy,
        );
      if (!activeReassignment) {
        return null;
      }
    }
    const result = await this.withdrawalDb.rejectWithdrawalRequest(
      withdrawalId,
      reason,
    );
    if (!result) {
      return null;
    }
    const managerDetails = await this.employeeService.getEmployee(performedBy);
    if (managerDetails) {
      await this.logService.logRequestHelper({
        performedBy: performedBy,
        requestType: Request.WITHDRAWAL,
        action: Action.REJECT,
        staffName: `${managerDetails.staffFName} ${managerDetails.staffLName}`,
        dept: managerDetails.dept as Dept,
        position: managerDetails.position,
        reason: reason,
        requestId: withdrawalId,
      });
    }
    return HttpStatusResponse.OK;
  }

  public async updateWithdrawalStatusToExpired() {
    const withdrawalRequests =
      await this.withdrawalDb.updateWithdrawalStatusToExpired();

    if (withdrawalRequests && withdrawalRequests.length > 0) {
      const { requestId, requestedDate, requestType, staffId } =
        withdrawalRequests[0];

      const employee = await this.employeeService.getEmployee(staffId);

      const emailSubject = `[${Request.WITHDRAWAL}] Withdrawal Expired`;
      const emailContent = `Your request withdrawal has expired. Please contact your reporting manager for more details.`;
      const dayjsDate = dayjs(requestedDate);
      const formattedDate = dayjsDate.format("YYYY-MM-DD");
      await this.notificationService.notify(
        employee!.email,
        emailSubject,
        emailContent,
        null,
        [[formattedDate, requestType]],
      );

      /**
       * Logging
       */
      await this.logService.logRequestHelper({
        performedBy: PerformedBy.SYSTEM,
        requestId: requestId,
        requestType: Request.WITHDRAWAL,
        action: Action.EXPIRE,
        dept: PerformedBy.PERFORMED_BY_SYSTEM as any,
        position: PerformedBy.PERFORMED_BY_SYSTEM as any,
      });
    }
  }
}
export default WithdrawalService;
