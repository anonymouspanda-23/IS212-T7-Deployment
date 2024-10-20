import { errMsg } from "@/helpers";
import LogService from "@/services/LogService";
import { Context } from "koa";
import UtilsController from "./UtilsController";

class LogController {
  private logService: LogService;

  constructor(logService: LogService) {
    this.logService = logService;
  }

  public async getAllLogs(ctx: Context) {
    const { id } = ctx.request.header;
    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }
    const result = await this.logService.getAllLogs(Number(id));
    ctx.body = !result
      ? (ctx.body = { errMsg: errMsg.LOGS_NOT_FOUND })
      : result;
  }
}

export default LogController;
