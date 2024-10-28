import RequestDb from "@/database/RequestDb";
import {
  Action,
  Dept,
  EmailHeaders,
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
import NotificationService from "@/services/NotificationService";
import dayjs from "dayjs";
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
  private notificationService: NotificationService;
  private reassignmentService: ReassignmentService;
  private requestDb: RequestDb;

  constructor(
    logService: LogService,
    employeeService: EmployeeService,
    notificationService: NotificationService,
    requestDb: RequestDb,
    reassignmentService: ReassignmentService,
  ) {
    this.logService = logService;
    this.employeeService = employeeService;
    this.notificationService = notificationService;
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
      email,
      position,
    }: any = await this.employeeService.getEmployee(staffId);
    const dayjsDate = dayjs(result[0].requestedDate);
    const formattedDate = dayjsDate.format("YYYY-MM-DD");
    const requestedDate: [string, string][] = [
      [formattedDate, result[0].requestType],
    ];

    const manager = await this.employeeService.getEmployee(
      Number(reportingManager),
    );
    if (manager) {
      let emailSubject = `[${Request.APPLICATION}] Pending Application Cancelled`;
      let emailContent = `${staffFName} ${staffLName}, ${email} (${dept} - ${position}) has cancelled pending application.<br><br>Please login to the portal to view updated request list.`;
      await this.notificationService.notify(
        manager.email,
        emailSubject,
        emailContent,
        null,
        requestedDate,
      );

      emailSubject = `[${Request.APPLICATION}] Pending Application Cancelled`;
      emailContent = `Your application cancellation has been sent to ${manager.staffFName} ${manager.staffLName}, ${manager.email} (${manager.dept} - ${manager.position}).`;
      await this.notificationService.notify(
        email,
        emailSubject,
        emailContent,
        null,
        requestedDate,
      );
    }

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
        reportingManagerId: reportingManager,
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

    if (responseDates.successDates.length == 0) {
      return responseDates;
    }

    const employee = await this.employeeService.getEmployee(
      Number(requestDetails.staffId),
    );
    if (employee) {
      await this.notificationService.pushRequestSentNotification(
        EmailHeaders.REQUEST_SENT,
        employee.email,
        employee.reportingManager,
        Request.APPLICATION,
        responseDates.successDates,
        requestDetails.reason,
      );

      const manager = await this.employeeService.getEmployee(
        Number(employee.reportingManager),
      );
      if (manager) {
        const emailSubject = `[${Request.APPLICATION}] Pending Application Request`;
        const emailContent = `You have a pending application request from ${employee.staffFName} ${employee.staffLName}, ${employee.email} (${employee.dept} - ${employee.position}).<br><br>Reason for application: ${requestDetails.reason}.<br><br>Please login to the portal to approve the request.`;
        await this.notificationService.notify(
          manager.email,
          emailSubject,
          emailContent,
          null,
          responseDates.successDates,
        );
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
    const result = await this.requestDb.approveRequest(requestId);
    if (!result) {
      return null;
    }
    const manager = await this.employeeService.getEmployee(Number(performedBy));
    if (manager) {
      const emailSubject = `[${Request.APPLICATION}] Application Approved`;
      const emailContent = `Your application has been approved by ${manager.staffFName} ${manager.staffLName}, ${manager.email} (${manager.dept} - ${manager.position}).<br><br>Please login to the portal to view the request.`;
      const dayjsDate = dayjs(request.requestedDate);
      const formattedDate = dayjsDate.format("YYYY-MM-DD");
      const requestedDate: [string, string][] = [
        [String(formattedDate), String(request.requestType)],
      ];
      await this.notificationService.notify(
        employee.email,
        emailSubject,
        emailContent,
        null,
        requestedDate,
      );
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
    const result = await this.requestDb.rejectRequest(requestId, reason);
    if (!result) {
      return null;
    }

    const manager = await this.employeeService.getEmployee(Number(performedBy));
    if (manager) {
      const emailSubject = `[${Request.APPLICATION}] Application Rejected`;
      const emailContent = `Your application has been rejected by ${manager.staffFName} ${manager.staffLName}, ${manager.email} (${manager.dept} - ${manager.position}).<br><br>Reason: ${reason}<br><br>Please login to the portal to view the request.`;
      const dayjsDate = dayjs(request.requestedDate);
      const formattedDate = dayjsDate.format("YYYY-MM-DD");
      const requestedDate: [string, string][] = [
        [String(formattedDate), String(request.requestType)],
      ];
      await this.notificationService.notify(
        employee.email,
        emailSubject,
        emailContent,
        null,
        requestedDate,
      );
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
        const { requestId, staffId, requestedDate, requestType } = request;
        const employee = await this.employeeService.getEmployee(staffId);

        const emailSubject = `[${Request.APPLICATION}] Application Expired`;
        const emailContent = `Your application has expired. Please re-apply.`;
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

    let managerDetails = await this.employeeService.getEmployee(
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
      managerDetails = await this.employeeService.getEmployee(performedBy!);
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

    if (managerDetails) {
      const dayjsDate = dayjs(request.requestedDate);
      const formattedDate = dayjsDate.format("YYYY-MM-DD");
      const requestedDate: [string, string][] = [
        [String(formattedDate), String(request.requestType)],
      ];
      const employee = await this.employeeService.getEmployee(request.staffId);
      if (employee) {
        const emailSubject = `[${Request.APPLICATION}] Application Revoked`;
        const emailContent = `Your application has been revoked by ${managerDetails.staffFName} ${managerDetails.staffLName}, ${managerDetails.email} (${managerDetails.dept} - ${managerDetails.position}).<br><br>Reason: ${reason}.<br><br>Please login to the portal to view the revocation.`;
        await this.notificationService.notify(
          employee.email,
          emailSubject,
          emailContent,
          null,
          requestedDate,
        );
      }
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
