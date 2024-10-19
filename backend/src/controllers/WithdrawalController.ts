import UtilsController from "@/controllers/UtilsController";
import { errMsg, HttpStatusResponse } from "@/helpers";
import WithdrawalService from "@/services/WithdrawalService";
import { Context } from "koa";

class WithdrawalController {
  private withdrawalService: WithdrawalService;

  constructor(withdrawalService: WithdrawalService) {
    this.withdrawalService = withdrawalService;
  }

  public async withdrawRequest(ctx: Context) {
    const { requestId } = ctx.request.body as any;
    if (!requestId) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }
    const result = await this.withdrawalService.withdrawRequest(
      Number(requestId),
    );

    ctx.body =
      result == HttpStatusResponse.OK
        ? HttpStatusResponse.OK
        : HttpStatusResponse.NOT_MODIFIED;
  }

  public async getSubordinatesWithdrawalRequests(ctx: Context) {
    const { id } = ctx.request.header;
    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }
    const subordinatesRequests =
      await this.withdrawalService.getSubordinatesWithdrawalRequests(
        Number(id),
      );
    ctx.body = subordinatesRequests;
  }

  public async getOwnWithdrawalRequests(ctx: Context) {
    const { staffId } = ctx.query;
    if (!staffId) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }
    const ownRequests = await this.withdrawalService.getOwnWithdrawalRequests(
      Number(staffId),
    );
    ctx.body = ownRequests;
  }
}

export default WithdrawalController;
