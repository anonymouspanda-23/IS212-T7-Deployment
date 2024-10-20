import LogDb from "@/database/LogDb";
import { Action, Dept, PerformedBy, Request, Role } from "@/helpers";
import EmployeeService from "./EmployeeService";

interface iLogRequest {
  performedBy: PerformedBy | string;
  requestType: Request;
  action: Action;
  dept?: Dept;
  position?: string;
  requestId?: number;
  reason?: string;
  staffName?: string;
  reportingManagerId?: number;
  managerName?: string;
}

class LogService {
  private logDb: LogDb;
  private employeeService: EmployeeService;

  constructor(logDb: LogDb, employeeService: EmployeeService) {
    this.logDb = logDb;
    this.employeeService = employeeService;
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

    const isManagerOrHR = role === Role.HR || role === Role.Manager;
    const allLogs = await this.logDb.getLogs();

    if (isManagerOrHR) {
      return allLogs;
    }

    if (allLogs[dept] && allLogs[dept][position]) {
      const personalLogs = {
        [dept]: {
          [position]: allLogs[dept][position],
        },
      };
      return personalLogs;
    }

    return null;
  }
}

export default LogService;
