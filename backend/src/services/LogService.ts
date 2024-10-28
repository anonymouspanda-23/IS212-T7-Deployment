import LogDb from "@/database/LogDb";
import ReassignmentDb from "@/database/ReassignmentDb";
import { Action, Dept, PerformedBy, Request, Role } from "@/helpers";
import EmployeeService from "./EmployeeService";

interface iLogRequest {
  performedBy: PerformedBy | string;
  requestType: Request;
  action: Action;
  dept: Dept;
  position: string;
  requestId?: number;
  reason?: string;
  staffName?: string;
  reportingManagerId?: number;
  managerName?: string;
}

class LogService {
  private logDb: LogDb;
  private employeeService: EmployeeService;
  private reassignmentDb: ReassignmentDb;

  constructor(
    logDb: LogDb,
    employeeService: EmployeeService,
    reassignmentDb: ReassignmentDb,
  ) {
    this.logDb = logDb;
    this.employeeService = employeeService;
    this.reassignmentDb = reassignmentDb;
  }

  public async logRequestHelper(options: iLogRequest) {
    /**
     * Logging
     */
    const {
      performedBy,
      requestType,
      action,
      dept = null,
      position = null,
      requestId = null,
      reason = null,
      staffName = null,
      reportingManagerId = null,
      managerName = null,
    } = options;

    const actionTaken = {
      performedBy,
      requestType,
      action,
      dept,
      position,
      requestId,
      reason,
      staffName,
      reportingManagerId,
      managerName,
    };

    await this.logActions(actionTaken);
  }

  public async logActions(logAction: any): Promise<void> {
    const log = {
      ...logAction,
    };

    await this.logDb.logAction(log);
  }

  public async getAllLogs(staffId: number) {
    const { role, dept, position }: any =
      await this.employeeService.getEmployee(staffId);

    const isRoleOne = role === Role.HR;
    const isRoleTwo = role === Role.Staff;
    const isRoleThree = role === Role.Manager;
    const allLogs = await this.logDb.getLogs();
    const personalLogs = await this.logDb.getOwnLogs(staffId);

    if (isRoleOne) {
      return allLogs;
    }

    if (isRoleThree) {
      const subordinateLogs = await this.logDb.getSubordinateLogs(staffId);
      const activeReassignment =
        await this.reassignmentDb.getActiveReassignmentAsTempManager(staffId);
      const logs = [...personalLogs, ...subordinateLogs];

      if (!!activeReassignment) {
        const originalManagerId = activeReassignment.staffId;
        const originalManagerSubordinates =
          await this.logDb.getSubordinateLogs(originalManagerId);
        logs.push(...originalManagerSubordinates);
      }

      const personalAndTeamLogs = {
        [dept]: {
          [position]: logs,
        },
      };

      return personalAndTeamLogs;
    }

    if (isRoleTwo) {
      const ownLogs = {
        [dept]: {
          [position]: personalLogs,
        },
      };
      return ownLogs;
    }

    return null;
  }
}

export default LogService;
