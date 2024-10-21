import RequestDb from "@/database/RequestDb";
import {
  Action,
  Dept,
  errMsg,
  HttpStatusResponse,
  PerformedBy,
  Request,
} from "@/helpers";
import { Role } from "@/helpers/";
import {
  checkDate,
  checkLatestDate,
  checkPastDate,
  checkPastWithdrawalDate,
  checkValidWithdrawalDate,
  checkWeekend,
  weekMap,
} from "@/helpers/date";
import { IRequest } from "@/models/Request";
import EmployeeService from "./EmployeeService";
import LogService from "./LogService";
import ReassignmentService from "./ReassignmentService";

interface ResponseDates {
  successDates: [string, string][];
  noteDates: [string, string][];
  errorDates: [string, string][];
  weekendDates: [string, string][];
  pastDates: [string, string][];
  pastDeadlineDates: [string, string][];
  duplicateDates: [string, string][];
  insertErrorDates: [string, string][];
}

class RequestService {
  private logService: LogService;
  private employeeService: EmployeeService;
  private reassignmentService: ReassignmentService;
  private requestDb: RequestDb;

  constructor(
    logService: LogService,
    employeeService: EmployeeService,
    requestDb: RequestDb,
    reassignmentService: ReassignmentService,
  ) {
    this.logService = logService;
    this.employeeService = employeeService;
    this.requestDb = requestDb;
    this.reassignmentService = reassignmentService;
  }

  public async updateRequestinitiatedWithdrawalValue(requestId: number) {
    return await this.requestDb.updateRequestinitiatedWithdrawalValue(
      requestId,
    );
  }

  public async getMySchedule(myId: number) {
    const employee = await this.employeeService.getEmployee(myId);
    if (!employee) {
      return errMsg.USER_DOES_NOT_EXIST;
    }

    const schedule = await this.requestDb.getMySchedule(myId);
    if (schedule.length < 1) {
      return errMsg.REQUESTS_NOT_FOUND;
    }

    return schedule;
  }

  public async cancelPendingRequests(
    staffId: number,
    requestId: number,
  ): Promise<string | null> {
    const result = await this.requestDb.cancelPendingRequests(
      staffId,
      requestId,
    );

    if (!result) {
      return null;
    }

    const {
      staffFName,
      staffLName,
      reportingManager,
      reportingManagerName,
      dept,
      position,
    }: any = await this.employeeService.getEmployee(staffId);

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: staffId,
      requestType: Request.APPLICATION,
      action: Action.CANCEL,
      dept: dept,
      position: position,
      requestId: requestId,
      staffName: `${staffFName} ${staffLName}`,
      reportingManagerId: reportingManager,
      managerName: reportingManagerName,
    });

    return HttpStatusResponse.OK;
  }

  public async getAllSubordinatesRequests(
    staffId: number,
  ): Promise<IRequest[]> {
    const surbodinatesRequests =
      await this.requestDb.getAllSubordinatesRequests(staffId);
    return surbodinatesRequests;
  }

  public async getOwnPendingRequests(myId: number): Promise<IRequest[]> {
    const pendingRequests = await this.requestDb.getOwnPendingRequests(myId);
    if (pendingRequests && pendingRequests.length > 0) {
      /**
       * Logging
       */
      await this.logService.logRequestHelper({
        performedBy: myId,
        requestType: Request.APPLICATION,
        action: Action.RETRIEVE,
        staffName: pendingRequests[0].staffName,
        dept: pendingRequests[0].dept as Dept,
        position: pendingRequests[0].position,
        reportingManagerId: pendingRequests[0].reportingManager as any,
        managerName: pendingRequests[0].managerName,
      });
    }
    return pendingRequests;
  }

  public async getSchedule(staffId: number) {
    const employee = await this.employeeService.getEmployee(staffId);
    if (!employee) {
      return errMsg.USER_DOES_NOT_EXIST;
    }

    const {
      role,
      position,
      reportingManager,
      dept,
      staffFName,
      staffLName,
      reportingManagerName,
    } = employee;
    const allDeptTeamCount = await this.employeeService.getAllDeptTeamCount();

    const isManagerOrHR = role === Role.HR || role === Role.Manager;
    const wfhStaff = isManagerOrHR
      ? await this.requestDb.getAllDeptSchedule()
      : await this.requestDb.getTeamSchedule(reportingManager, position);

    // Check for any temp dept/teams
    const activeReassignment =
      await this.reassignmentService.getActiveReassignmentAsTempManager(
        staffId,
      );

    let schedule: any = {};

    if (isManagerOrHR) {
      schedule = {
        ...allDeptTeamCount,
      };
      for (const dept of Object.keys(allDeptTeamCount)) {
        if (
          activeReassignment &&
          activeReassignment.active &&
          activeReassignment.originalManagerDept === dept
        ) {
          allDeptTeamCount[dept].wfhStaff = wfhStaff[dept] || [];
          allDeptTeamCount[dept].isTempTeam = true;
        } else {
          allDeptTeamCount[dept].wfhStaff = wfhStaff[dept] || [];
        }
      }

      /**
       * Logging
       */
      await this.logService.logRequestHelper({
        performedBy: staffId,
        requestType: Request.APPLICATION,
        action: Action.RETRIEVE,
        staffName: `${staffFName} ${staffLName}`,
        dept: dept as Dept,
        position: position,
      });
    } else {
      schedule = {
        [dept]: {
          teams: {
            [position]: allDeptTeamCount[dept].teams[position],
          },
        },
      };
      schedule[dept].wfhStaff = wfhStaff;

      /**
       * Logging
       */
      await this.logService.logRequestHelper({
        performedBy: staffId,
        requestType: Request.APPLICATION,
        action: Action.RETRIEVE,
        staffName: `${staffFName} ${staffLName}`,
        reportingManagerId: reportingManager,
        managerName: reportingManagerName,
        dept: dept as Dept,
        position: position,
      });
    }

    return schedule;
  }

  public async getCompanySchedule() {
    const companySchedule = await this.requestDb.getCompanySchedule();
    return companySchedule;
  }

  public async getPendingOrApprovedRequests(myId: number) {
    const requests = await this.requestDb.getPendingOrApprovedRequests(myId);
    return requests;
  }

  public async postRequest(requestDetails: any) {
    let responseDates: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };
    const result = await this.getPendingOrApprovedRequests(
      requestDetails.staffId,
    );

    const dateList = result.map((request) => request.requestedDate);
    const weekMapping = weekMap(dateList);
    const seenDates = new Set();

    for (const dateType of requestDetails.requestedDates) {
      const [date, type] = dateType;
      let dateInput = new Date(date);
      if (!seenDates.has(date)) {
        seenDates.add(date);
      } else {
        responseDates.duplicateDates.push(dateType);
        continue;
      }
      if (checkWeekend(dateInput)) {
        responseDates.weekendDates.push(dateType);
        continue;
      }
      if (checkPastDate(dateInput)) {
        responseDates.pastDates.push(dateType);
        continue;
      }

      if (checkLatestDate(dateInput)) {
        responseDates.pastDeadlineDates.push(dateType);
        continue;
      }

      if (dateList.some((d) => d.getTime() === dateInput.getTime())) {
        responseDates.errorDates.push(dateType);
        continue;
      }

      let checkWeek = checkDate(dateInput, weekMapping);

      if (checkWeek) {
        responseDates.noteDates.push(dateType);
      }

      const employee = await this.employeeService.getEmployee(
        Number(requestDetails.staffId),
      );
      const {
        staffFName,
        staffLName,
        reportingManager,
        reportingManagerName,
        dept,
        position,
      } = employee!;

      const document = {
        staffId: requestDetails.staffId,
        staffName: `${staffFName} ${staffLName}`,
        reportingManager,
        managerName: reportingManagerName,
        dept,
        requestedDate: date,
        requestType: type,
        reason: requestDetails.reason,
        position,
        initiatedWithdrawal: false,
      };

      const requestInsert = await this.requestDb.postRequest(document);

      if (requestInsert) {
        responseDates.successDates.push(dateType);
        const reqId = requestInsert as number;
        /**
         * Logging
         */
        await this.logService.logRequestHelper({
          performedBy: requestDetails.staffId,
          requestType: Request.APPLICATION,
          action: Action.APPLY,
          dept: dept as Dept,
          position: position,
          requestId: reqId,
          staffName: `${staffFName} ${staffLName}`,
          reportingManagerId: reportingManager,
          managerName: reportingManagerName,
        });
      } else {
        responseDates.insertErrorDates.push(dateType);
      }
    }
    return responseDates;
  }

  public async getPendingRequestByRequestId(requestId: number) {
    const requestDetail =
      await this.requestDb.getPendingRequestByRequestId(requestId);
    return requestDetail;
  }

  public async getApprovedRequestByRequestId(requestId: number) {
    const requestDetail =
      await this.requestDb.getApprovedRequestByRequestId(requestId);
    return requestDetail;
  }

  public async approveRequest(
    performedBy: number,
    requestId: number,
  ): Promise<string | null> {
    let reassignment;
    const request = await this.getPendingRequestByRequestId(requestId);
    if (!request) {
      return null;
    }
    const actionTakenBy: any =
      await this.employeeService.getEmployee(performedBy);

    const employee = await this.employeeService.getEmployee(request.staffId);
    if (!employee) {
      return null;
    }
    if (performedBy !== employee.reportingManager) {
      reassignment = await this.reassignmentService.getReassignmentActive(
        request.reportingManager as any,
        performedBy,
      );
      if (!reassignment) {
        return null;
      }
    }
    const result = await this.requestDb.approveRequest(performedBy, requestId);
    if (!result) {
      return null;
    }

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: performedBy,
      requestType: Request.APPLICATION,
      action: Action.APPROVE,
      requestId: requestId,
      staffName: reassignment?.tempManagerName ?? employee.reportingManagerName,
      dept: actionTakenBy.dept,
      position: actionTakenBy.position,
    });

    return HttpStatusResponse.OK;
  }

  public async rejectRequest(
    performedBy: number,
    requestId: number,
    reason: string,
  ): Promise<string | null> {
    let reassignment;
    const request = await this.getPendingRequestByRequestId(requestId);
    if (!request) {
      return null;
    }
    const managerDetails = await this.employeeService.getEmployee(
      request.reportingManager!,
    );
    const employee = await this.employeeService.getEmployee(request.staffId);
    if (!employee) {
      return null;
    }
    if (performedBy !== employee.reportingManager) {
      reassignment = await this.reassignmentService.getReassignmentActive(
        request.reportingManager as any,
        performedBy,
      );
      if (!reassignment) {
        return null;
      }
    }
    const result = await this.requestDb.rejectRequest(
      performedBy,
      requestId,
      reason,
    );
    if (!result) {
      return null;
    }

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: performedBy,
      requestType: Request.APPLICATION,
      action: Action.REJECT,
      requestId: requestId,
      staffName: reassignment?.tempManagerName ?? employee.reportingManagerName,
      reason: reason,
      dept: managerDetails!.dept as Dept,
      position: managerDetails!.position,
    });
    return HttpStatusResponse.OK;
  }

  public async updateRequestStatusToExpired() {
    const requests = await this.requestDb.updateRequestStatusToExpired();
    if (!!requests) {
      for (const request of requests) {
        const { requestId } = request;
        /**
         * Logging
         */
        await this.logService.logRequestHelper({
          performedBy: PerformedBy.SYSTEM,
          requestId: requestId,
          requestType: Request.REASSIGNMENT,
          action: Action.EXPIRE,
          dept: PerformedBy.PERFORMED_BY_SYSTEM as any,
          position: PerformedBy.PERFORMED_BY_SYSTEM as any,
        });
      }
    }
  }

  public async revokeRequest(
    performedBy: number,
    requestId: number,
    reason: string,
  ): Promise<string | null> {
    let reassignment;
    const request = await this.getApprovedRequestByRequestId(requestId);
    if (!request) {
      return null;
    }

    const managerDetails = await this.employeeService.getEmployee(
      request.reportingManager!,
    );
    if (performedBy !== request.reportingManager) {
      reassignment = await this.reassignmentService.getReassignmentActive(
        request.reportingManager as any,
        performedBy,
      );
      if (!reassignment) {
        return null;
      }
    }

    if (
      checkPastWithdrawalDate(request.requestedDate) &&
      !checkValidWithdrawalDate(request.requestedDate)
    ) {
      return null;
    }

    const result = await this.requestDb.revokeRequest(requestId, reason);
    if (!result) {
      return null;
    }

    /**
     * Logging
     */
    await this.logService.logRequestHelper({
      performedBy: performedBy,
      requestType: Request.APPLICATION,
      action: Action.REVOKE,
      requestId: requestId,
      staffName: reassignment?.tempManagerName ?? request.managerName,
      reason: reason,
      dept: managerDetails!.dept as Dept,
      position: managerDetails!.position,
    });

    return HttpStatusResponse.OK;
  }

  public async setWithdrawnStatus(requestId: number): Promise<string | null> {
    const result = await this.requestDb.setWithdrawnStatus(requestId);
    if (!result) {
      return null;
    }
    return HttpStatusResponse.OK;
  }
}
export default RequestService;
