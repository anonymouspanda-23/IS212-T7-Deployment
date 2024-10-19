import UtilsController from "@/controllers/UtilsController";
import EmployeeDb from "@/database/EmployeeDb";
import { AccessControl, errMsg, PERMISSIONS } from "@/helpers";
import { numberSchema } from "@/schema";
import EmployeeService from "@/services/EmployeeService";
import { Context, Next } from "koa";

const employeeDb = new EmployeeDb();
const employeeService = new EmployeeService(employeeDb);

export const checkUserRolePermission = (action: AccessControl) => {
  return async (ctx: Context, next: Next) => {
    const { id } = ctx.request.header;
    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }

    const sanitisedStaffId = numberSchema.parse(id);
    const employee = await employeeService.getEmployee(sanitisedStaffId);
    if (!employee) {
      return UtilsController.throwAPIError(ctx, errMsg.USER_DOES_NOT_EXIST);
    }

    if (!PERMISSIONS[employee.role].includes(action)) {
      return UtilsController.throwAPIError(ctx, errMsg.UNAUTHORISED);
    }

    await next();
  };
};