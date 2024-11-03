import UtilsController from "@/controllers/UtilsController";
import { errMsg } from "@/helpers";
import { LoginBody } from "@/models/Employee";
import { numberSchema } from "@/schema";
import EmployeeService from "@/services/EmployeeService";
import { Context } from "koa";

class EmployeeController {
  private employeeService: EmployeeService;

  constructor(employeeService: EmployeeService) {
    this.employeeService = employeeService;
  }

  public async getEmployee(ctx: Context) {
    const { staffId } = ctx.query;
    if (!staffId) {
      ctx.status = 400;
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }

    const result = await this.employeeService.getEmployee(Number(staffId));

    if (result === null) {
      ctx.status = 404;
      ctx.body = {
        "error": errMsg.USER_DOES_NOT_EXIST
      }
      return;
    }
    ctx.body = result;
  }

  public async getEmployeeByEmail(ctx: Context) {
    const { staffEmail, staffPassword } = ctx.request.body as LoginBody;

    if (!staffEmail || !staffPassword) {
      ctx.status = 400;
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_PARAMETERS);
    }

    const result = await this.employeeService.getEmployeeByEmail(
      String(staffEmail),
      String(staffPassword),
    );

    if (result == errMsg.USER_DOES_NOT_EXIST) {
      ctx.status = 404;
      return UtilsController.throwAPIError(ctx, errMsg.USER_DOES_NOT_EXIST);
    }

    if (result == errMsg.WRONG_PASSWORD) {
      ctx.status = 401;
      return UtilsController.throwAPIError(ctx, errMsg.WRONG_PASSWORD);
    }

    const {
      staffId,
      staffFName,
      staffLName,
      dept,
      position,
      email,
      reportingManager,
      reportingManagerName,
      role,
    } = result;

    const name = `${staffFName} ${staffLName}`;

    ctx.body = {
      staffId,
      name,
      dept,
      position,
      email,
      reportingManager,
      reportingManagerName,
      role,
    };
  }

  public async getDeptByManager(ctx: Context) {
    const { staffId } = ctx.query;
    const validation = numberSchema.safeParse(staffId);
    if (!validation.success) {
      ctx.status = 400;
      ctx.body = {
        errMsg: validation.error.format(),
      };
      return;
    }

    let result = null;

    try {
      result = await this.employeeService.getDeptByManager(Number(staffId));
    } catch (e) {
      if (e instanceof Error) {
        ctx.body = {
          error: e.message,
        };
      } else {
        ctx.body = {
          error: "An unknown error occurred",
        };
      }
      return;
    }

    ctx.body = result;
  }

  public async getRoleOneOrThreeEmployees(ctx: Context) {
    const { id } = ctx.request.header;
    if (!id) {
      ctx.status = 400;
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }
    const employees = await this.employeeService.getRoleOneOrThreeEmployees(
      Number(id),
    );
    ctx.body = employees;
  }
}

export default EmployeeController;
