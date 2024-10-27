import { Action, errMsg, HttpStatusResponse } from "@/helpers";
import { IHandleReassignment } from "@/models/Reassignment";
import { numberSchema, reassignmentRequestSchema } from "@/schema";
import ReassignmentService from "@/services/ReassignmentService";
import { Context } from "koa";
import UtilsController from "./UtilsController";

class ReassignmentController {
  private reassignmentService: ReassignmentService;

  constructor(reassignmentService: ReassignmentService) {
    this.reassignmentService = reassignmentService;
  }

  public async insertReassignmentRequest(ctx: Context) {
    const reassignmentRequest = ctx.request.body;
    const validBody = reassignmentRequestSchema.safeParse(reassignmentRequest);
    if (!validBody.success) {
      ctx.body = {
        errMsg: validBody.error.format(),
      };
      return;
    }

    const result =
      await this.reassignmentService.insertReassignmentRequest(
        reassignmentRequest,
      );

    if (result === errMsg.NON_REJECTED_REASSIGNMENT) {
      ctx.body = {
        errMsg: errMsg.NON_REJECTED_REASSIGNMENT,
      };
    } else {
      ctx.body = HttpStatusResponse.OK;
    }
  }

  public async getReassignmentStatus(ctx: Context) {
    const { id } = ctx.request.header;
    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }
    const sanitisedStaffId = numberSchema.parse(id);
    const reassignmentReq =
      await this.reassignmentService.getReassignmentStatus(sanitisedStaffId);

    ctx.body = reassignmentReq;
  }

  
  public async getTempMgrReassignmentStatus(ctx: Context) {
    const { id } = ctx.request.header;
    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }
    const sanitisedStaffId = numberSchema.parse(id);
    const reassignmentReq =
      await this.reassignmentService.getTempMgrReassignmentStatus(sanitisedStaffId);

    ctx.body = reassignmentReq;
  }

  public async getIncomingReassignmentRequests(ctx: Context) {
    const { id } = ctx.request.header;
    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }
    const sanitisedStaffId = numberSchema.parse(id);
    const incomingRequests =
      await this.reassignmentService.getIncomingReassignmentRequests(
        sanitisedStaffId,
      );

    ctx.body = incomingRequests;
  }

  public async handleReassignmentRequest(ctx: Context) {
    const { id: staffId } = ctx.request.header;
    const { reassignmentId, action } = ctx.request.body as IHandleReassignment;

    if (!staffId) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }

    if (!reassignmentId || !action) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }

    const sanitisedStaffId = numberSchema.parse(staffId.toString());
    const sanitisedReassignmentId = numberSchema.parse(
      reassignmentId.toString(),
    );

    if (action !== Action.APPROVE && action !== Action.REJECT) {
      return UtilsController.throwAPIError(ctx, errMsg.INVALID_ACTION);
    }

    try {
      await this.reassignmentService.handleReassignmentRequest(
        sanitisedStaffId,
        sanitisedReassignmentId,
        action,
      );
      ctx.body = HttpStatusResponse.OK;
    } catch (error) {
      ctx.status = 400;
      ctx.body = { error: errMsg.GENERIC_ERROR };
    }
  }

  public getSubordinateRequestsForTempManager = async (ctx: Context) => {
    const { id } = ctx.request.header;

    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }

    const sanitisedStaffId = numberSchema.parse(id);

    try {
      const subordinateRequests =
        await this.reassignmentService.getSubordinateRequestsForTempManager(
          sanitisedStaffId,
        );

      if (subordinateRequests === null) {
        ctx.status = 404;
        ctx.body = { error: errMsg.NO_ACTIVE_REASSIGNMENT };
        return;
      }

      ctx.body = subordinateRequests;
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: errMsg.GENERIC_ERROR };
    }
  };
}

export default ReassignmentController;
