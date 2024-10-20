import { Action, Dept, Request, Role } from "@/helpers";
import LogService from "./LogService";

describe("logRequestHelper", () => {
  let logService: LogService;
  let mockEmployeeService: any;
  let mockLogDb: any;

  beforeEach(() => {
    mockEmployeeService = {
      getEmployee: jest.fn(),
    } as any;

    mockLogDb = {
      logAction: jest.fn(),
    } as any;

    logService = new LogService(mockLogDb, mockEmployeeService);
  });

  it("should log the action taken with the provided options", async () => {
    const options = {
      performedBy: "User1",
      requestType: Request.APPLICATION,
      action: Action.APPROVE,
      dept: Dept.HR,
      position: "Manager",
      requestId: 1,
      reason: "Routine Check",
      staffName: "John Doe",
      reportingManagerId: 150143,
      managerName: "Jane Smith",
    };

    await logService.logRequestHelper(options);
    expect(mockLogDb.logAction).toHaveBeenCalledWith(options);
  });
});

describe("getAllLogs", () => {
  let logService: LogService;
  let mockEmployeeService: any;
  let mockLogDb: any;

  beforeEach(() => {
    mockEmployeeService = {
      getEmployee: jest.fn(),
    } as any;

    mockLogDb = {
      getLogs: jest.fn(),
    } as any;

    logService = new LogService(mockLogDb, mockEmployeeService);
  });

  it("should return all logs for role 1", async () => {
    const mockData = {
      staffId: 1,
      role: Role.HR,
      dept: Dept.HR,
      position: "Manager",
      allLogs: {
        HR: {
          Manager: ["log1", "log2"],
        },
        Engineering: {
          "Senior Engineers": ["log1", "log2"],
        },
      },
    };
    const { staffId, role, dept, position, allLogs } = mockData;
    mockEmployeeService.getEmployee.mockResolvedValue({ role, dept, position });
    mockLogDb.getLogs.mockResolvedValue(allLogs);
    const result = await logService.getAllLogs(staffId);

    expect(mockEmployeeService.getEmployee).toHaveBeenCalledWith(staffId);
    expect(mockLogDb.getLogs).toHaveBeenCalled();
    expect(result).toEqual(allLogs);
  });

  it("should return personal logs for role 2", async () => {
    const mockData = {
      staffId: 2,
      role: Role.Staff,
      dept: Dept.ENGINEERING,
      position: "Senior Engineers",
      allLogs: {
        Engineering: {
          "Senior Engineers": ["log1", "log2"],
        },
      },
    };
    const { staffId, role, dept, position, allLogs } = mockData;
    mockEmployeeService.getEmployee.mockResolvedValue({ role, dept, position });
    mockLogDb.getLogs.mockResolvedValue(allLogs);
    const result = await logService.getAllLogs(staffId);

    expect(mockEmployeeService.getEmployee).toHaveBeenCalledWith(staffId);
    expect(mockLogDb.getLogs).toHaveBeenCalled();
    expect(result).toEqual(allLogs);
  });

  it("should return empty logs if no logs found", async () => {
    const mockData = {
      staffId: 2,
      role: Role.Staff,
      dept: Dept.ENGINEERING,
      position: "Senior Engineers",
      allLogs: [],
    };
    const { staffId, role, dept, position, allLogs } = mockData;
    mockEmployeeService.getEmployee.mockResolvedValue({ role, dept, position });
    mockLogDb.getLogs.mockResolvedValue(allLogs);
    const result = await logService.getAllLogs(staffId);

    expect(mockEmployeeService.getEmployee).toHaveBeenCalledWith(staffId);
    expect(mockLogDb.getLogs).toHaveBeenCalled();
    expect(result).toEqual(null);
  });
});
