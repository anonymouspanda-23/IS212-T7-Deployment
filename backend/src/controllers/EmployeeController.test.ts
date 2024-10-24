import EmployeeController from "@/controllers/EmployeeController";
import EmployeeDb from "@/database/EmployeeDb";
import { errMsg } from "@/helpers";
import EmployeeService from "@/services/EmployeeService";
import { generateMockEmployee } from "@/tests/mockData";
import { Context } from "koa";
import UtilsController from "./UtilsController";

describe("EmployeeController", () => {
  let employeeController: EmployeeController;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let employeeDbMock: EmployeeDb;
  let ctx: Context;
  let mockEmployee: any;

  beforeEach(() => {
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;
    employeeController = new EmployeeController(employeeServiceMock);
    ctx = {
      method: "POST",
      query: {},
      body: {},
      request: { body: {} },
      response: {},
    } as Context;
    mockEmployee = generateMockEmployee();
    employeeServiceMock.getEmployeeByEmail = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return an error when missing parameters", async () => {
    // Act
    await employeeController.getEmployeeByEmail(ctx);

    // Assert
    expect(ctx.body).toEqual({
      error: errMsg.MISSING_PARAMETERS,
    });
  });

  it("should return employee role when a valid email and password is provided", async () => {
    // Arrange
    ctx.request.body = {
      staffEmail: "test@example.com",
      staffPassword: "test-password",
    };

    const {
      staffId,
      staffFName,
      staffLName,
      dept,
      position,
      email,
      reportingManager,
      role,
    } = mockEmployee;

    const returnValue: any = {
      staffId,
      name: `${staffFName} ${staffLName}`,
      dept,
      position,
      email,
      reportingManager,
      role,
    };
    employeeServiceMock.getEmployeeByEmail.mockResolvedValue(returnValue);

    // Act
    await employeeController.getEmployeeByEmail(ctx);

    // Assert
    expect(ctx.body).toEqual(returnValue);
  });

  it("should inform user of failure to find an employee with provided email", async () => {
    // Arrange
    ctx.request.body = {
      staffEmail: "nonexistent@example.com",
      staffPassword: "password",
    };
    employeeServiceMock.getEmployeeByEmail.mockResolvedValue(
      errMsg.USER_DOES_NOT_EXIST,
    );

    // Act
    await employeeController.getEmployeeByEmail(ctx);

    // Assert
    expect(ctx.body).toEqual({
      error: errMsg.USER_DOES_NOT_EXIST,
    });
  });

  it("should inform user of authentication error with valid email", async () => {
    // Arrange
    ctx.request.body = {
      staffEmail: "test@example.com",
      staffPassword: "password",
    };
    employeeServiceMock.getEmployeeByEmail.mockResolvedValue(
      errMsg.WRONG_PASSWORD,
    );

    // Act
    await employeeController.getEmployeeByEmail(ctx);

    // Assert
    expect(ctx.body).toEqual({
      error: errMsg.WRONG_PASSWORD,
    });
  });
});

describe("EmployeeController", () => {
  let employeeController: EmployeeController;
  let employeeService: EmployeeService;
  let employeeDb: EmployeeDb;
  let ctx: Context;

  beforeEach(() => {
    employeeService = new EmployeeService(employeeDb);
    employeeController = new EmployeeController(employeeService);

    ctx = {
      query: {},
      body: null,
    } as unknown as Context;
  });

  it("should return an error if staffId is missing", async () => {
    const throwAPIErrorSpy = jest.spyOn(UtilsController, "throwAPIError");

    await employeeController.getEmployee(ctx);

    expect(throwAPIErrorSpy).toHaveBeenCalledWith(
      ctx,
      errMsg.MISSING_PARAMETERS,
    );
  });

  it("should call getEmployee with the correct staffId and set ctx.body", async () => {
    const mockEmployee = { id: 1, name: "John Doe" };
    const staffId = "1";
    ctx.query.staffId = staffId;

    const getEmployeeSpy = jest
      .spyOn(employeeService, "getEmployee")
      .mockResolvedValue(mockEmployee as any);

    await employeeController.getEmployee(ctx);

    expect(getEmployeeSpy).toHaveBeenCalledWith(Number(staffId));
    expect(ctx.body).toBe(mockEmployee);
  });
});

describe("getDeptByManager", () => {
  let employeeController: EmployeeController;
  let employeeService: EmployeeService;
  let employeeDb: EmployeeDb;
  let ctx: Context;

  beforeEach(() => {
    employeeService = new EmployeeService(employeeDb);
    employeeController = new EmployeeController(employeeService);

    ctx = {
      query: {},
      body: {},
    } as unknown as Context;
  });

  it("should call getDeptByManager with the correct staffId and set ctx.body", async () => {
    const mockDept = { id: 1, name: "Engineering" };
    const staffId = "1";
    ctx.query.staffId = staffId;

    const getDeptByManagerSpy = jest
      .spyOn(employeeService, "getDeptByManager")
      .mockResolvedValue(mockDept as any);

    await employeeController.getDeptByManager(ctx);

    expect(getDeptByManagerSpy).toHaveBeenCalledWith(Number(staffId));
    expect(ctx.body).toBe(mockDept);
  });

  it("should handle errors thrown by getDeptByManager and set ctx.body with error message", async () => {
    const staffId = "1";
    ctx.query.staffId = staffId;

    const errorMessage = "Database connection failed";
    jest
      .spyOn(employeeService, "getDeptByManager")
      .mockRejectedValue(new Error(errorMessage));

    await employeeController.getDeptByManager(ctx);

    expect(ctx.body).toEqual({ error: errorMessage });
  });

  it("should handle unknown errors and set ctx.body with a generic error message", async () => {
    const staffId = "1";
    ctx.query.staffId = staffId;

    jest
      .spyOn(employeeService, "getDeptByManager")
      .mockRejectedValue("Unknown error");

    await employeeController.getDeptByManager(ctx);

    expect(ctx.body).toEqual({ error: "An unknown error occurred" });
  });
});

describe("getRoleOneOrThreeEmployees", () => {
  let employeeController: EmployeeController;
  let employeeService: EmployeeService;
  let employeeDb: EmployeeDb;
  let ctx: Context;

  beforeEach(() => {
    employeeService = new EmployeeService(employeeDb);
    employeeController = new EmployeeController(employeeService);

    ctx = {
      request: {
        header: {
          id: 1,
        },
      },
      body: null,
    } as unknown as Context;
  });

  it("should set ctx.body with the list of employees", async () => {
    const mockEmployees = [
      { id: 1, name: "Alice", role: 1 },
      { id: 2, name: "Bob", role: 2 },
    ];

    const getRoleOneEmployeesSpy = jest
      .spyOn(employeeService, "getRoleOneOrThreeEmployees")
      .mockResolvedValue(mockEmployees as any);

    await employeeController.getRoleOneOrThreeEmployees(ctx);

    expect(getRoleOneEmployeesSpy).toHaveBeenCalled();
    expect(ctx.body).toBe(mockEmployees);
  });
});
