import EmployeeController from "@/controllers/EmployeeController";
import EmployeeDb from "@/database/EmployeeDb";
import { errMsg } from "@/helpers";
import EmployeeService from "@/services/EmployeeService";
import { generateMockEmployee } from "@/tests/mockData";
import { Context } from "koa";

describe("EmployeeController", () => {
  let employeeController: EmployeeController;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let employeeDbMock: EmployeeDb;
  let ctx: Context;
  let mockEmployee: any;

  beforeEach(() => {
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    employeeServiceMock = new EmployeeService(
      employeeDbMock
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
  })

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
      errMsg.USER_DOES_NOT_EXIST
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
      errMsg.WRONG_PASSWORD
    );

    // Act
    await employeeController.getEmployeeByEmail(ctx);

    // Assert
    expect(ctx.body).toEqual({
      error: errMsg.WRONG_PASSWORD,
    });
  });
});
