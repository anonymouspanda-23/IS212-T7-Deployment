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
      inputPassword,
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
      inputPassword,
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
      inputPassword,
    );

    // Assert
    expect(result).toEqual(errMsg.WRONG_PASSWORD);
  });
});

describe("getRoleOneOrThreeEmployees", () => {
  let employeeService: EmployeeService;

  let employeeDbMock: any;

  beforeEach(() => {
    employeeDbMock = {
      getRoleOneOrThreeEmployees: jest.fn(),
    };

    employeeService = new EmployeeService(employeeDbMock);
  });

  it("should return the list of employees with role one or three", async () => {
    const mockEmployees = [
      { id: 1, name: "Alice", role: 1 },
      { id: 2, name: "Bob", role: 3 },
    ];

    employeeDbMock.getRoleOneOrThreeEmployees.mockResolvedValue(mockEmployees);

    const result = await employeeService.getRoleOneOrThreeEmployees(1);
    expect(result).toEqual(mockEmployees);
  });

  it("should return an empty array if no employees are found", async () => {
    employeeDbMock.getRoleOneOrThreeEmployees.mockResolvedValue([]);

    const result = await employeeService.getRoleOneOrThreeEmployees(1);
    expect(result).toEqual([]);
  });

  it("should call getRoleOneOrThreeEmployees from employeeDb", async () => {
    await employeeService.getRoleOneOrThreeEmployees(1);
    expect(employeeDbMock.getRoleOneOrThreeEmployees).toHaveBeenCalled();
  });
});

describe("getAllDeptTeamCount", () => {
  let employeeService: EmployeeService;
  let employeeDbMock: any;

  beforeEach(() => {
    employeeDbMock = {
      getAllDeptTeamCount: jest.fn(),
    };

    employeeService = new EmployeeService(employeeDbMock);
  });

  it("should return the department team count", async () => {
    const mockDeptCount = [
      { dept: "Sales", count: 10 },
      { dept: "Engineering", count: 5 },
    ];

    employeeDbMock.getAllDeptTeamCount.mockResolvedValue(mockDeptCount);

    const result = await employeeService.getAllDeptTeamCount();
    expect(result).toEqual(mockDeptCount);
  });

  it("should return an empty array if no department counts are found", async () => {
    employeeDbMock.getAllDeptTeamCount.mockResolvedValue([]);

    const result = await employeeService.getAllDeptTeamCount();
    expect(result).toEqual([]);
  });

  it("should call getAllDeptTeamCount from employeeDb", async () => {
    await employeeService.getAllDeptTeamCount();
    expect(employeeDbMock.getAllDeptTeamCount).toHaveBeenCalled();
  });
});

describe("getDeptByManager", () => {
  let employeeService: EmployeeService;
  let employeeDbMock: any;

  beforeEach(() => {
    employeeDbMock = {
      getDeptByManager: jest.fn(),
    };

    employeeService = new EmployeeService(employeeDbMock);
  });

  it("should return the department by manager", async () => {
    const staffId = 1;
    const mockDept = { dept: "Sales", managerId: staffId };

    employeeDbMock.getDeptByManager.mockResolvedValue(mockDept);

    const result = await employeeService.getDeptByManager(staffId);
    expect(result).toEqual(mockDept);
  });

  it("should return null if no department is found", async () => {
    const staffId = 2;

    employeeDbMock.getDeptByManager.mockResolvedValue(null);

    const result = await employeeService.getDeptByManager(staffId);
    expect(result).toBeNull();
  });

  it("should call getDeptByManager from employeeDb with correct staffId", async () => {
    const staffId = 3;

    await employeeService.getDeptByManager(staffId);
    expect(employeeDbMock.getDeptByManager).toHaveBeenCalledWith(staffId);
  });
});

describe("getEmployee", () => {
  let employeeService: EmployeeService;
  let employeeDbMock: any;

  beforeEach(() => {
    employeeDbMock = {
      getEmployee: jest.fn(),
    };

    employeeService = new EmployeeService(employeeDbMock);
  });

  it("should return the employee details for a valid staffId", async () => {
    const staffId = 1;
    const mockEmployee = { id: staffId, name: "Alice", role: 1 };

    employeeDbMock.getEmployee.mockResolvedValue(mockEmployee);

    const result = await employeeService.getEmployee(staffId);
    expect(result).toEqual(mockEmployee);
  });

  it("should return null if no employee is found", async () => {
    const staffId = 2;

    employeeDbMock.getEmployee.mockResolvedValue(null);

    const result = await employeeService.getEmployee(staffId);
    expect(result).toBeNull();
  });

  it("should call getEmployee from employeeDb with correct staffId", async () => {
    const staffId = 3;

    await employeeService.getEmployee(staffId);
    expect(employeeDbMock.getEmployee).toHaveBeenCalledWith(staffId);
  });
});
