import ReassignmentDb from "@/database/ReassignmentDb";
import { Action, errMsg, PerformedBy, Request, Status } from "@/helpers";
import EmployeeService from "./EmployeeService";
import LogService from "./LogService";
import RequestDb from "@/database/RequestDb";

class ReassignmentService {
  private reassignmentDb: ReassignmentDb;
  private requestDb: RequestDb;
  private employeeService: EmployeeService;
  private logService: LogService;

  constructor(
    reassignmentDb: ReassignmentDb,
    requestDb: RequestDb,
    employeeService: EmployeeService,
    logService: LogService,
  ) {
    this.reassignmentDb = reassignmentDb;
    this.requestDb = requestDb;
    this.employeeService = employeeService;
    this.logService = logService;
  }

  public async insertReassignmentRequest(
    reassignmentRequest: any,
  ): Promise<any> {
    const { staffId, tempReportingManagerId } = reassignmentRequest;
    const currentManager = await this.employeeService.getEmployee(staffId);
    const tempReportingManager = await this.employeeService.getEmployee(
      tempReportingManagerId,
    );
    const managerName = `${currentManager!.staffFName} ${currentManager!.staffLName}`;

    // Check if there is any active reassignment between Manager A and Manager B
    const activeReassignmentReq =
      await this.reassignmentDb.getReassignmentActive(
        staffId,
        tempReportingManagerId,
      );

    if (!!activeReassignmentReq) {
      return errMsg.ACTIVE_REASSIGNMENT;
    }

    // Check if Manager B is occupied
    const tempManagerReassignmentReq =
      await this.reassignmentDb.getActiveReassignmentAsTempManager(
        tempReportingManagerId,
      );

    if (!!tempManagerReassignmentReq) {
      return errMsg.TEMP_MANAGER_OCCUPIED;
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

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: staffId,
      requestType: Request.REASSIGNMENT,
      action: Action.APPLY,
      staffName: managerName,
    });
  }

  public async getReassignmentStatus(staffId: number) {
    const { staffFName, staffLName }: any =
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
    });

    return await this.reassignmentDb.getReassignmentRequest(staffId);
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
    action: Action.APPROVE | Action.REJECT
  ): Promise<void> {
    const reassignment = await this.reassignmentDb.getIncomingReassignmentRequests(staffId);

    if (!reassignment) {
      throw new Error('Reassignment request not found');
    }

    if (reassignment[0].tempReportingManagerId !== staffId) {
      throw new Error('Unauthorized to perform this action');
    }

    if (reassignment[0].status !== Status.PENDING) {
      throw new Error('This request has already been processed');
    }

    const newStatus = action === Action.APPROVE ? Status.APPROVED : Status.REJECTED;
   
    await this.reassignmentDb.updateReassignmentStatus(reassignmentId, newStatus);
  }

  public async getSubordinateRequestsForTempManager(staffId: number) {
    const reassignment = await this.reassignmentDb.getActiveReassignmentAsTempManager(staffId);
    if (!reassignment) {
      return null;
    }

    const subordinateRequests = await this.requestDb.getAllSubordinatesRequests(reassignment.staffId);

    // filter approved requests based on reassignment dates
    return subordinateRequests.filter(request => {
      if (request.status === Status.APPROVED) {
        const requestDate = new Date(request.requestedDate);
        const reassignmentStartDate = new Date(reassignment.startDate);
        const reassignmentEndDate = new Date(reassignment.endDate);

        return (
          // only return approved requests if they are between startDate and endDate of reassignment
          (requestDate >= reassignmentStartDate) &&
          (requestDate <= reassignmentEndDate)
        );
      }
      // keep all pending requests
      else return request.status === Status.PENDING;
    });
  }
}
  


export default ReassignmentService;
