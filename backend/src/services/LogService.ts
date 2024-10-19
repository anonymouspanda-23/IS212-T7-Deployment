import LogDb from "@/database/LogDb";
import { Action, Dept, PerformedBy, Request } from "@/helpers";

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

  constructor(logDb: LogDb) {
    this.logDb = logDb;
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

  public async getAllLogs() {
    return await this.logDb.getLogs();
  }
}

export default LogService;
