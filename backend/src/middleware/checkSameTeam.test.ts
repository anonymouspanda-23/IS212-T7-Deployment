import UtilsController from "@/controllers/UtilsController";
import EmployeeDb from "@/database/EmployeeDb";
import { Dept, errMsg } from "@/helpers";
import EmployeeService from "@/services/EmployeeService";
import { middlewareMockData } from "@/tests/middlewareMockData";
import { Context, Next } from "koa";
import { checkSameTeam } from "./checkSameTeam";

describe("checkSameTeam middleware", () => {
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let employeeDbMock: EmployeeDb;
  let ctx: Context;
  let next: Next;
  const checkSameTeamMiddleware = checkSameTeam();

  beforeEach(() => {
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    employeeServiceMock = new EmployeeService(
      employeeDbMock
    ) as jest.Mocked<EmployeeService>;

    next = jest.fn();
    EmployeeService.prototype.getEmployee = jest.fn();
    UtilsController.throwAPIError = jest.fn();
  });

  it("should throw an error if id is missing in the header", async () => {
    ctx = {
      request: {
        header: {},
      },
      query: {
        reportingManager: String(middlewareMockData.Sales_Manager.staffId),
        dept: Dept.SALES,
      },
    } as unknown as Context;
    ctx.request.header.id = undefined;

    await checkSameTeamMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).toHaveBeenCalledWith(
      ctx,
      errMsg.MISSING_HEADER
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw an error if user does not exist", async () => {
    const invalidStaffId = "999";
    ctx = {
      request: {
        header: {
          id: invalidStaffId,
        },
      },
      query: {
        reportingManager: String(middlewareMockData.Sales_Manager.staffId),
        dept: Dept.SALES,
      },
    } as unknown as Context;

    employeeServiceMock.getEmployee.mockResolvedValue(null);
    await checkSameTeamMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).toHaveBeenCalledWith(
      ctx,
      errMsg.USER_DOES_NOT_EXIST
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw an error if an ordinary engineer attempts to fetch sales department schedule", async () => {
    ctx = {
      request: {
        header: {
          id: String(middlewareMockData.Engineering.staffId),
        },
      },
      query: {
        reportingManager: String(middlewareMockData.Sales_Manager.staffId),
        dept: Dept.SALES,
      },
    } as unknown as Context;

    employeeServiceMock.getEmployee.mockResolvedValue(
      middlewareMockData.Engineering as any
    );

    await checkSameTeamMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).toHaveBeenCalledWith(
      ctx,
      errMsg.DIFFERENT_DEPARTMENT
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should throw an error if an ordinary and different sale team user attempts to fetch other sales team's schedule", async () => {
    ctx = {
      request: {
        header: {
          id: String(middlewareMockData.Sales_Different_Team.staffId),
        },
      },
      query: {
        reportingManager: String(middlewareMockData.Sales_Manager.staffId),
        dept: Dept.SALES,
      },
    } as unknown as Context;

    employeeServiceMock.getEmployee.mockResolvedValue(
      middlewareMockData.Sales_Different_Team as any
    );

    await checkSameTeamMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).toHaveBeenCalledWith(
      ctx,
      errMsg.DIFFERENT_TEAM
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should be able to view team schedule if user is from the same team", async () => {
    ctx = {
      request: {
        header: {
          id: String(middlewareMockData.Sales_Same_Team.staffId),
        },
      },
      query: {
        reportingManager: String(middlewareMockData.Sales_Manager.staffId),
        dept: Dept.SALES,
      },
    } as unknown as Context;

    employeeServiceMock.getEmployee.mockResolvedValue(
      middlewareMockData.Sales_Same_Team as any
    );

    await checkSameTeamMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).not.toHaveBeenCalledWith(
      ctx,
      errMsg.DIFFERENT_DEPARTMENT
    );
    expect(UtilsController.throwAPIError).not.toHaveBeenCalledWith(
      ctx,
      errMsg.DIFFERENT_TEAM
    );
    expect(next).toHaveBeenCalled();
  });

  it("should be able to view team schedule as long as the roleId is 1", async () => {
    ctx = {
      request: {
        header: {
          id: String(middlewareMockData.CEO.staffId),
        },
      },
      query: {
        reportingManager: String(middlewareMockData.Sales_Manager.staffId),
        dept: Dept.SALES,
      },
    } as unknown as Context;

    employeeServiceMock.getEmployee.mockResolvedValue(
      middlewareMockData.CEO as any
    );

    await checkSameTeamMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).not.toHaveBeenCalledWith(
      ctx,
      errMsg.DIFFERENT_DEPARTMENT
    );
    expect(UtilsController.throwAPIError).not.toHaveBeenCalledWith(
      ctx,
      errMsg.DIFFERENT_TEAM
    );
    expect(next).toHaveBeenCalled();
  });
});
