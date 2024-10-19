import UtilsController from "@/controllers/UtilsController";
import { errMsg, HttpStatusResponse, noteMsg, successMsg } from "@/helpers";
import {
  approvalSchema,
  rejectionSchema,
  requestSchema,
  revocationSchema,
  staffIdSchema,
} from "@/schema";
import RequestService from "@/services/RequestService";
import { Context } from "koa";

interface MessageDates {
  message: string;
  dates: [string, string][];
}

interface ResponseMessage {
  success: MessageDates;
  error: MessageDates[];
  note: MessageDates;
}

class RequestController {
  private requestService: RequestService;

  constructor(requestService: RequestService) {
    this.requestService = requestService;
  }

  public async cancelPendingRequests(ctx: Context) {
    const { staffId, requestId } = ctx.request.body as any;
    const result = await this.requestService.cancelPendingRequests(
      Number(staffId),
      Number(requestId),
    );

    ctx.body =
      result == HttpStatusResponse.OK
        ? HttpStatusResponse.OK
        : HttpStatusResponse.NOT_MODIFIED;
  }

  public async getAllSubordinatesRequests(ctx: Context) {
    const { id } = ctx.request.header;
    const subordinatesRequests =
      await this.requestService.getAllSubordinatesRequests(Number(id));
    ctx.body = subordinatesRequests;
  }

  public async getOwnPendingRequests(ctx: Context) {
    const { myId } = ctx.query;
    if (!myId) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }
    const pendingRequests = await this.requestService.getOwnPendingRequests(
      Number(myId),
    );
    ctx.body = pendingRequests;
  }

  public async getMySchedule(ctx: Context) {
    const { myId } = ctx.query;
    if (!myId) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }

    const result = await this.requestService.getMySchedule(Number(myId));
    ctx.body = result;
  }

  public async getSchedule(ctx: Context) {
    const { id } = ctx.request.header;
    const validation = staffIdSchema.safeParse({ id });

    if (!validation.success) {
      ctx.body = {
        errMsg: validation.error.format(),
      };
      return;
    }

    const result = await this.requestService.getSchedule(Number(id));
    ctx.body = result;
  }

  public async postRequest(ctx: any) {
    const requestDetails = ctx.request.body;
    const validation = requestSchema.safeParse(requestDetails);
    if (!validation.success) {
      ctx.body = {
        errMsg: validation.error.format(),
      };
      return;
    }
    const result = await this.requestService.postRequest(requestDetails);
    let responseMessage: ResponseMessage = {
      success: { message: "", dates: [] },
      error: [],
      note: { message: "", dates: [] },
    };

    if (result.successDates.length > 0) {
      responseMessage.success = {
        message: successMsg,
        dates: result.successDates,
      };
    }

    if (result.weekendDates.length > 0) {
      responseMessage.error.push({
        message: errMsg.WEEKEND_REQUEST,
        dates: result.weekendDates,
      });
    }

    if (result.pastDates.length > 0) {
      responseMessage.error.push({
        message: errMsg.PAST_DATE,
        dates: result.pastDates,
      });
    }

    if (result.pastDeadlineDates.length > 0) {
      responseMessage.error.push({
        message: errMsg.PAST_DEADLINE,
        dates: result.pastDeadlineDates,
      });
    }

    if (result.errorDates.length > 0) {
      responseMessage.error.push({
        message: errMsg.SAME_DAY_REQUEST,
        dates: result.errorDates,
      });
    }

    if (result.duplicateDates.length > 0) {
      responseMessage.error.push({
        message: errMsg.DUPLICATE_DATE,
        dates: result.duplicateDates,
      });
    }

    if (result.insertErrorDates.length > 0) {
      responseMessage.error.push({
        message: errMsg.INSERT_ERROR,
        dates: result.insertErrorDates,
      });
    }

    if (result.noteDates.length > 0) {
      responseMessage.note = {
        message: noteMsg,
        dates: result.noteDates,
      };
    }

    ctx.body = responseMessage;
  }

  public async approveRequest(ctx: Context) {
    const approvalDetails = ctx.request.body;
    const validation = approvalSchema.safeParse(approvalDetails);
    if (!validation.success) {
      ctx.body = {
        errMsg: validation.error.format(),
      };
      return;
    }
    const { performedBy, requestId } = ctx.request.body as any;
    const result = await this.requestService.approveRequest(
      Number(performedBy),
      Number(requestId),
    );
    ctx.body =
      result == HttpStatusResponse.OK
        ? HttpStatusResponse.OK
        : HttpStatusResponse.NOT_MODIFIED;
  }

  public async rejectRequest(ctx: Context) {
    const rejectionDetails = ctx.request.body;
    const validation = rejectionSchema.safeParse(rejectionDetails);
    if (!validation.success) {
      ctx.body = {
        errMsg: validation.error.format(),
      };
      return;
    }
    const { performedBy, requestId, reason } = rejectionDetails as any;

    const result = await this.requestService.rejectRequest(
      Number(performedBy),
      Number(requestId),
      reason,
    );
    ctx.body =
      result == HttpStatusResponse.OK
        ? HttpStatusResponse.OK
        : HttpStatusResponse.NOT_MODIFIED;
  }

    public async revokeRequest(ctx: Context) {
    const revocationDetails = ctx.request.body;
    const validation = revocationSchema.safeParse(revocationDetails);
    if (!validation.success) {
      ctx.body = {
        errMsg: validation.error.format(),
      };
      return;
    }
    const { performedBy, requestId, reason } = revocationDetails as any;

    const result = await this.requestService.revokeRequest(
      Number(performedBy),
      Number(requestId),
      reason,
    );
    ctx.body =
      result == HttpStatusResponse.OK
        ? HttpStatusResponse.OK
        : HttpStatusResponse.NOT_MODIFIED;
  }
}

export default RequestController;
