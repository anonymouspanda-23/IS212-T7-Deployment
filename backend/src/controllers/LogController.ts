import LogService from "@/services/LogService";
import { Context } from "koa";

class LogController {
  private logService: LogService;

  constructor(logService: LogService) {
    this.logService = logService;
  }

  public async getAllLogs(ctx: Context) {
    const result = await this.logService.getAllLogs();
    ctx.body = result;
  }
}

export default LogController;
