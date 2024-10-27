import ReassignmentDb from "@/database/ReassignmentDb";
import RequestDb from "@/database/RequestDb";
import { Action, Dept, errMsg, PerformedBy, Request, Status } from "@/helpers";
import EmployeeService from "./EmployeeService";
import LogService from "./LogService";
import NotificationService from "./NotificationService";
import dayjs from "dayjs";

class ReassignmentService {
  private reassignmentDb: ReassignmentDb;
  private requestDb: RequestDb;
  private employeeService: EmployeeService;
  private logService: LogService;
  private notificationService: NotificationService;

  constructor(
    reassignmentDb: ReassignmentDb,
    requestDb: RequestDb,
    employeeService: EmployeeService,
    logService: LogService,
    notificationService: NotificationService,
  ) {
    this.reassignmentDb = reassignmentDb;
    this.requestDb = requestDb;
    this.employeeService = employeeService;
    this.logService = logService;
    this.notificationService = notificationService;
  }

  public async insertReassignmentRequest(
    reassignmentRequest: any,
  ): Promise<any> {
    const { staffId, tempReportingManagerId, startDate, endDate } =
      reassignmentRequest;
    const currentManager = await this.employeeService.getEmployee(staffId);
    const tempReportingManager = await this.employeeService.getEmployee(
      tempReportingManagerId,
    );
    const managerName = `${currentManager!.staffFName} ${currentManager!.staffLName}`;

    const hasNonRejectedReassignmentBetweenStartAndEndDate =
      await this.reassignmentDb.hasNonRejectedReassignment(
        staffId!,
        startDate!,
        endDate!,
      );

    if (hasNonRejectedReassignmentBetweenStartAndEndDate) {
      return errMsg.NON_REJECTED_REASSIGNMENT;
    }

    const request = {
      ...reassignmentRequest,
      staffName: `${currentManager!.staffFName} ${currentManager!.staffLName}`,
      originalManagerDept: currentManager!.dept,
      tempManagerName: `${tempReportingManager!.staffFName} ${tempReportingManager!.staffLName}`,
      status: Status.PENDING,
      active: null,
    };

    await this.reassignmentDb.insertReassignmentRequest(request);
    const dayjsStartDate = dayjs(startDate);
    const formattedStartDate = dayjsStartDate.format("YYYY-MM-DD");
    const dayjsEndDate = dayjs(endDate);
    const formattedEndDate = dayjsEndDate.format("YYYY-MM-DD");

    let emailSubject = `[${Request.REASSIGNMENT}] Pending Reassignment Request`;
    let emailContent = `You have a pending reassignment request from ${managerName}, ${currentManager!.email} (${currentManager!.dept} - ${currentManager!.position}) and requires your approval. Please login to the portal to approve the request.`;
    await this.notificationService.notify(
      tempReportingManager!.email,
      emailSubject,
      emailContent,
      [formattedStartDate, formattedEndDate],
      null,
    );

    emailSubject = `[${Request.REASSIGNMENT}] Pending Reassignment Request`;
    emailContent = `Your reassignment request for the following dates have been sent to ${tempReportingManager?.staffFName} ${tempReportingManager?.staffLName}, ${tempReportingManager?.email} (${tempReportingManager?.dept} - ${tempReportingManager?.position}).`;
    await this.notificationService.notify(
      currentManager!.email,
      emailSubject,
      emailContent,
      [formattedStartDate, formattedEndDate],
      null,
    );

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: staffId,
      requestType: Request.REASSIGNMENT,
      action: Action.APPLY,
      staffName: managerName,
      dept: currentManager!.dept as Dept,
      position: currentManager!.position,
    });
  }

  public async getReassignmentStatus(staffId: number) {
    const { staffFName, staffLName, dept, position }: any =
      await this.employeeService.getEmployee(staffId);

    const staffName = `${staffFName} ${staffLName}`;

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: staffId,
      requestType: Request.REASSIGNMENT,
      action: Action.RETRIEVE,
      staffName: staffName,
      dept: dept as Dept,
      position: position,
    });

    return await this.reassignmentDb.getReassignmentRequest(staffId);
  }

  public async getTempMgrReassignmentStatus(staffId: number) {
    const { staffFName, staffLName, dept, position }: any =
      await this.employeeService.getEmployee(staffId);

    const staffName = `${staffFName} ${staffLName}`;

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: staffId,
      requestType: Request.REASSIGNMENT,
      action: Action.RETRIEVE,
      staffName: staffName,
      dept: dept as Dept,
      position: position,
    });

    return await this.reassignmentDb.getTempMgrReassignmentRequest(staffId);
  }

  public async setActiveReassignmentPeriod(): Promise<void> {
    const isActiveUpdated =
      await this.reassignmentDb.setActiveReassignmentPeriod();

    if (isActiveUpdated) {
      /**
       * Logging
       */
      await this.logService.logRequestHelper({
        performedBy: PerformedBy.SYSTEM,
        requestType: Request.REASSIGNMENT,
        action: Action.SET_ACTIVE,
        dept: PerformedBy.SYSTEM as any,
        position: PerformedBy.SYSTEM as any,
      });
    }
  }

  public async setInactiveReassignmentPeriod(): Promise<void> {
    const isActiveUpdated =
      await this.reassignmentDb.setInactiveReassignmentPeriod();

    if (isActiveUpdated) {
      /**
       * Logging
       */
      await this.logService.logRequestHelper({
        performedBy: PerformedBy.SYSTEM,
        requestType: Request.REASSIGNMENT,
        action: Action.SET_INACTIVE,
        dept: PerformedBy.SYSTEM as any,
        position: PerformedBy.SYSTEM as any,
      });
    }
  }

  public async getReassignmentActive(
    staffId: number,
    tempReportingManagerId: number,
  ) {
    const activeFlag = await this.reassignmentDb.getReassignmentActive(
      staffId,
      tempReportingManagerId,
    );
    return activeFlag;
  }

  public async getActiveReassignmentAsTempManager(staffId: number) {
    const activeReassignments =
      await this.reassignmentDb.getActiveReassignmentAsTempManager(staffId);
    return activeReassignments;
  }

  public async getIncomingReassignmentRequests(staffId: number) {
    return await this.reassignmentDb.getIncomingReassignmentRequests(staffId);
  }

  public async handleReassignmentRequest(
    staffId: number,
    reassignmentId: number,
    action: Action.APPROVE | Action.REJECT,
  ): Promise<void> {
    const reassignment =
      await this.reassignmentDb.getIncomingReassignmentRequests(staffId);

    if (!reassignment) {
      throw new Error("Reassignment request not found");
    }

    if (reassignment[0].tempReportingManagerId !== staffId) {
      throw new Error("Unauthorized to perform this action");
    }

    if (reassignment[0].status !== Status.PENDING) {
      throw new Error("This request has already been processed");
    }

    const newStatus =
      action === Action.APPROVE ? Status.APPROVED : Status.REJECTED;

    await this.reassignmentDb.updateReassignmentStatus(
      reassignmentId,
      newStatus,
    );

    const requestedManager = await this.employeeService.getEmployee(
      reassignment[0].staffId,
    );
    const currentManager = await this.employeeService.getEmployee(staffId);
    if (requestedManager && currentManager) {
      const reassignmentAction =
        action === Action.APPROVE ? "Approved" : "Rejected";
      const dayjsStartDate = dayjs(reassignment[0].startDate);
      const formattedStartDate = dayjsStartDate.format("YYYY-MM-DD");
      const dayjsEndDate = dayjs(reassignment[0].endDate);
      const formattedEndDate = dayjsEndDate.format("YYYY-MM-DD");

      const emailSubject = `[${Request.REASSIGNMENT}] Reassignment ${reassignmentAction}`;
      const emailContent = `Your reassignment request has been ${reassignmentAction.toLowerCase()} by ${currentManager.staffFName} ${currentManager.staffLName}, ${currentManager.email} (${currentManager.dept} - ${currentManager.position}). Please login to the portal to view the reassignment request.`;
      await this.notificationService.notify(
        requestedManager.email,
        emailSubject,
        emailContent,
        [formattedStartDate, formattedEndDate],
        null,
      );

      await this.logService.logRequestHelper({
        performedBy: staffId,
        requestType: Request.REASSIGNMENT,
        action: action,
        staffName: `${currentManager.staffFName} ${currentManager.staffLName}`,
        dept: currentManager.dept as Dept,
        position: currentManager.position,
      });
    }
  }

  public async getSubordinateRequestsForTempManager(staffId: number) {
    const reassignment =
      await this.reassignmentDb.getActiveReassignmentAsTempManager(staffId);
    if (!reassignment) {
      return null;
    }

    const subordinateRequests = await this.requestDb.getAllSubordinatesRequests(
      reassignment.staffId,
    );

    // filter approved requests based on reassignment dates
    return subordinateRequests.filter((request) => {
      if (
        request.status === Status.APPROVED ||
        request.status === Status.REJECTED
      ) {
        const requestDate = new Date(request.requestedDate);
        const reassignmentStartDate = new Date(reassignment.startDate);
        const reassignmentEndDate = new Date(reassignment.endDate);

        return (
          // only return approved requests if they are between startDate and endDate of reassignment
          requestDate >= reassignmentStartDate &&
          requestDate <= reassignmentEndDate
        );
      }
      // keep all pending requests
      else return request.status === Status.PENDING;
    });
  }
}

export default ReassignmentService;
