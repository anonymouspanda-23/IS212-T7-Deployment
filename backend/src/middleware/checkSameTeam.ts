import UtilsController from "@/controllers/UtilsController";
import EmployeeDb from "@/database/EmployeeDb";
import { errMsg, Role } from "@/helpers";
import { numberSchema } from "@/schema";
import EmployeeService from "@/services/EmployeeService";
import { Context, Next } from "koa";

const employeeDb = new EmployeeDb();
const employeeService = new EmployeeService(employeeDb);

export const checkSameTeam = () => {
  return async (ctx: Context, next: Next) => {
    const { id } = ctx.request.header;
    const { reportingManager, dept } = ctx.query;

    if (!id) {
      return UtilsController.throwAPIError(ctx, errMsg.MISSING_HEADER);
    }

    const sanitisedReportingManagerId = numberSchema.parse(reportingManager);
    const sanitisedStaffId = numberSchema.parse(id);
    const employee = await employeeService.getEmployee(sanitisedStaffId);
    if (!employee) {
      return UtilsController.throwAPIError(ctx, errMsg.USER_DOES_NOT_EXIST);
    }

    if (dept !== employee.dept && employee.role !== Role.HR) {
      return UtilsController.throwAPIError(ctx, errMsg.DIFFERENT_DEPARTMENT);
    }

    if (
      sanitisedReportingManagerId !== employee.reportingManager &&
      employee.role !== Role.HR
    ) {
      return UtilsController.throwAPIError(ctx, errMsg.DIFFERENT_TEAM);
    }

    await next();
  };
};
