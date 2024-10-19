import EmployeeDb from "@/database/EmployeeDb";
import { errMsg } from "@/helpers";
import EmployeeService from "@/services/EmployeeService";
import { generateMockEmployee } from "@/tests/mockData";

describe("EmployeeService", () => {
  let employeeService: EmployeeService;
  let employeeDbMock: jest.Mocked<EmployeeDb>;
  let mockEmployee: any;

  beforeEach(async () => {
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    employeeService = new EmployeeService(employeeDbMock);
    mockEmployee = await generateMockEmployee();
    employeeDbMock.getEmployeeByEmail = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return employee details when a valid email and password is provided", async () => {
    // Arrange
    const staffEmail = "test@example.com";
    const inputPassword = "test-password";
    const returnValue: any = {
      staffId: mockEmployee.staffId,
      hashedPassword: mockEmployee.hashedPassword,
      role: mockEmployee.role,
    };
    employeeDbMock.getEmployeeByEmail.mockResolvedValue(returnValue);

    // Act
    const result = await employeeService.getEmployeeByEmail(
      staffEmail,
      inputPassword
    );

    // Assert
    expect(result).toEqual({
      staffId: mockEmployee.staffId,
      hashedPassword: mockEmployee.hashedPassword,
      role: mockEmployee.role,
    });
  });

  it("should inform user of failure to find an employee with provided email", async () => {
    // Arrange
    const staffEmail = "nonexistent@example.com";
    const inputPassword = "test-password";
    employeeDbMock.getEmployeeByEmail.mockResolvedValue(null);

    // Act
    const result = await employeeService.getEmployeeByEmail(
      staffEmail,
      inputPassword
    );

    // Assert
    expect(result).toEqual(errMsg.USER_DOES_NOT_EXIST);
  });

  it("should inform user of authentication error with valid email", async () => {
    // Arrange
    const staffEmail = "test@example.com";
    const inputPassword = "password";

    const returnValue: any = {
      staffId: mockEmployee.staffId,
      hashedPassword: mockEmployee.hashedPassword,
      role: mockEmployee.role,
    };

    employeeDbMock.getEmployeeByEmail.mockResolvedValue(returnValue);

    // Act
    const result = await employeeService.getEmployeeByEmail(
      staffEmail,
      inputPassword
    );

    // Assert
    expect(result).toEqual(errMsg.WRONG_PASSWORD);
  });
});
