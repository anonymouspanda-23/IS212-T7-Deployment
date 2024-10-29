import { Action, errMsg, PerformedBy, Request, Status } from "@/helpers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import ReassignmentService from "./ReassignmentService";

dayjs.extend(utc);

describe("insertReassignmentRequest", () => {
  let reassignmentService: ReassignmentService;
  let mockEmployeeService: any;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = "123";
  const tempReportingManagerId = "456";

  const currentManager = {
    staffFName: "John",
    staffLName: "Doe",
    dept: "Sales",
    position: "Manager",
  };

  const tempReportingManager = {
    staffFName: "Jane",
    staffLName: "Smith",
  };

  const reassignmentRequest = {
    staffId,
    tempReportingManagerId,
    startDate: dayjs().add(1, "day").utc(true).toISOString(),
    endDate: dayjs().subtract(30, "day").utc(true).toISOString(),
  };

  beforeEach(() => {
    mockEmployeeService = {
      getEmployee: jest.fn(),
    };

    mockReassignmentDb = {
      hasNonRejectedReassignment: jest.fn(),
      insertReassignmentRequest: jest.fn(),
    };

    mockLogService = {
      logRequestHelper: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fail if startDate is in the past", async () => {
    const pastDate = dayjs()
      .startOf("day")
      .subtract(1, "day")
      .utc(true)
      .toISOString();
    const reassignmentRequest = {
      staffId,
      tempReportingManagerId,
      startDate: pastDate,
      endDate: dayjs().subtract(30, "day").utc(true).toISOString(),
    };
    const result =
      await reassignmentService.insertReassignmentRequest(reassignmentRequest);
    expect(result).toBe(errMsg.PAST_DATE_NOT_ALLOWED);
  });

  it("should fail if startDate is today", async () => {
    const todayDate = dayjs().startOf("day").utc(true).toISOString();
    const reassignmentRequest = {
      staffId,
      tempReportingManagerId,
      startDate: todayDate,
      endDate: dayjs().subtract(30, "day").utc(true).toISOString(),
    };
    const result =
      await reassignmentService.insertReassignmentRequest(reassignmentRequest);
    expect(result).toBe(errMsg.CURRENT_DATE_NOT_ALLOWED);
  });

  it("should return error message if there is a non-rejected reassignment", async () => {
    mockEmployeeService.getEmployee
      .mockResolvedValueOnce(currentManager)
      .mockResolvedValueOnce(tempReportingManager);
    mockReassignmentDb.hasNonRejectedReassignment.mockResolvedValue(true);

    const result =
      await reassignmentService.insertReassignmentRequest(reassignmentRequest);

    expect(result).toBe(errMsg.NON_REJECTED_REASSIGNMENT);
    expect(mockReassignmentDb.insertReassignmentRequest).not.toHaveBeenCalled();
  });
});

describe("getReassignmentStatus", () => {
  let reassignmentService: ReassignmentService;
  let mockEmployeeService: any;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = 1;
  const employeeData = {
    staffFName: "John",
    staffLName: "Doe",
    dept: "Engineering",
    position: "Senior Engineers",
  };

  const reassignmentRequest = {
    id: 1,
    status: "PENDING",
  };

  beforeEach(() => {
    mockEmployeeService = {
      getEmployee: jest.fn(),
    };

    mockReassignmentDb = {
      getReassignmentRequest: jest.fn(),
    };

    mockLogService = {
      logRequestHelper: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve reassignment status and log the request", async () => {
    mockEmployeeService.getEmployee.mockResolvedValue(employeeData);
    mockReassignmentDb.getReassignmentRequest.mockResolvedValue(
      reassignmentRequest,
    );

    const result = await reassignmentService.getReassignmentStatus(staffId);

    expect(mockEmployeeService.getEmployee).toHaveBeenCalledWith(staffId);
    expect(mockLogService.logRequestHelper).toHaveBeenCalledWith({
      performedBy: staffId,
      requestType: Request.REASSIGNMENT,
      action: Action.RETRIEVE,
      staffName: "John Doe",
      dept: "Engineering",
      position: "Senior Engineers",
    });
    expect(mockReassignmentDb.getReassignmentRequest).toHaveBeenCalledWith(
      staffId,
    );
    expect(result).toEqual(reassignmentRequest);
  });
});

describe("getTempMgrReassignmentStatus", () => {
  let reassignmentService: ReassignmentService;
  let mockEmployeeService: any;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = 1;
  const employeeData = {
    staffFName: "John",
    staffLName: "Doe",
    dept: "Engineering",
    position: "Senior Engineer",
  };

  const tempMgrReassignmentRequest = {
    id: 1,
    status: "PENDING",
  };

  beforeEach(() => {
    mockEmployeeService = {
      getEmployee: jest.fn(),
    };

    mockReassignmentDb = {
      getTempMgrReassignmentRequest: jest.fn(),
    };

    mockLogService = {
      logRequestHelper: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve temporary manager reassignment status and log the request", async () => {
    mockEmployeeService.getEmployee.mockResolvedValue(employeeData);
    mockReassignmentDb.getTempMgrReassignmentRequest.mockResolvedValue(
      tempMgrReassignmentRequest,
    );

    const result =
      await reassignmentService.getTempMgrReassignmentStatus(staffId);

    expect(mockEmployeeService.getEmployee).toHaveBeenCalledWith(staffId);
    expect(mockLogService.logRequestHelper).toHaveBeenCalledWith({
      performedBy: staffId,
      requestType: Request.REASSIGNMENT,
      action: Action.RETRIEVE,
      staffName: "John Doe",
      dept: "Engineering",
      position: "Senior Engineer",
    });
    expect(
      mockReassignmentDb.getTempMgrReassignmentRequest,
    ).toHaveBeenCalledWith(staffId);
    expect(result).toEqual(tempMgrReassignmentRequest);
  });
});

describe("setActiveReassignmentPeriod", () => {
  let reassignmentService: ReassignmentService;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockEmployeeService: any;
  let mockLogService: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockReassignmentDb = {
      setActiveReassignmentPeriod: jest.fn(),
    };

    mockLogService = {
      logRequestHelper: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set the active reassignment period and log the action", async () => {
    mockReassignmentDb.setActiveReassignmentPeriod.mockResolvedValue(true);

    await reassignmentService.setActiveReassignmentPeriod();
    expect(mockReassignmentDb.setActiveReassignmentPeriod).toHaveBeenCalled();
    expect(mockLogService.logRequestHelper).toHaveBeenCalledWith({
      performedBy: PerformedBy.SYSTEM,
      requestType: Request.REASSIGNMENT,
      action: Action.SET_ACTIVE,
      dept: PerformedBy.SYSTEM,
      position: PerformedBy.SYSTEM,
    });
  });

  it("should not log if the active reassignment period is not updated", async () => {
    mockReassignmentDb.setActiveReassignmentPeriod.mockResolvedValue(false);
    await reassignmentService.setActiveReassignmentPeriod();

    expect(mockReassignmentDb.setActiveReassignmentPeriod).toHaveBeenCalled();
    expect(mockLogService.logRequestHelper).not.toHaveBeenCalled();
  });
});

describe("setInactiveReassignmentPeriod", () => {
  let reassignmentService: ReassignmentService;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockEmployeeService: any;
  let mockLogService: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockReassignmentDb = {
      setInactiveReassignmentPeriod: jest.fn(),
    };

    mockLogService = {
      logRequestHelper: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set the inactive reassignment period and log the action", async () => {
    mockReassignmentDb.setInactiveReassignmentPeriod.mockResolvedValue(true);

    await reassignmentService.setInactiveReassignmentPeriod();
    expect(mockReassignmentDb.setInactiveReassignmentPeriod).toHaveBeenCalled();
    expect(mockLogService.logRequestHelper).toHaveBeenCalledWith({
      performedBy: PerformedBy.SYSTEM,
      requestType: Request.REASSIGNMENT,
      action: Action.SET_INACTIVE,
      dept: PerformedBy.SYSTEM,
      position: PerformedBy.SYSTEM,
    });
  });

  it("should not log if the inactive reassignment period is not updated", async () => {
    mockReassignmentDb.setInactiveReassignmentPeriod.mockResolvedValue(false);
    await reassignmentService.setInactiveReassignmentPeriod();

    expect(mockReassignmentDb.setInactiveReassignmentPeriod).toHaveBeenCalled();
    expect(mockLogService.logRequestHelper).not.toHaveBeenCalled();
  });
});

describe("getReassignmentActive", () => {
  let reassignmentService: ReassignmentService;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockEmployeeService: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = 1;
  const tempReportingManagerId = 2;
  const expectedActiveFlag = true;

  beforeEach(() => {
    mockReassignmentDb = {
      getReassignmentActive: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the active reassignment flag", async () => {
    mockReassignmentDb.getReassignmentActive.mockResolvedValue(
      expectedActiveFlag,
    );

    const result = await reassignmentService.getReassignmentActive(
      staffId,
      tempReportingManagerId,
    );

    expect(mockReassignmentDb.getReassignmentActive).toHaveBeenCalledWith(
      staffId,
      tempReportingManagerId,
    );
    expect(result).toBe(expectedActiveFlag);
  });
});

describe("getActiveReassignmentAsTempManager", () => {
  let reassignmentService: ReassignmentService;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockEmployeeService: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = 1;
  const expectedActiveReassignments = [
    { id: 1, staffId: 2, tempReportingManagerId: staffId, status: "ACTIVE" },
    { id: 2, staffId: 3, tempReportingManagerId: staffId, status: "ACTIVE" },
  ];

  beforeEach(() => {
    mockReassignmentDb = {
      getActiveReassignmentAsTempManager: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return active reassignments for the temporary manager", async () => {
    mockReassignmentDb.getActiveReassignmentAsTempManager.mockResolvedValue(
      expectedActiveReassignments,
    );

    const result =
      await reassignmentService.getActiveReassignmentAsTempManager(staffId);

    expect(
      mockReassignmentDb.getActiveReassignmentAsTempManager,
    ).toHaveBeenCalledWith(staffId);
    expect(result).toEqual(expectedActiveReassignments);
  });
});

describe("getIncomingReassignmentRequests", () => {
  let reassignmentService: ReassignmentService;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockEmployeeService: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = 1;
  const expectedActiveReassignments = [
    { id: 1, staffId: 2, tempReportingManagerId: staffId, status: "ACTIVE" },
    { id: 2, staffId: 3, tempReportingManagerId: staffId, status: "ACTIVE" },
  ];

  beforeEach(() => {
    mockReassignmentDb = {
      getIncomingReassignmentRequests: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return incoming reassignments for the temporary manager", async () => {
    mockReassignmentDb.getIncomingReassignmentRequests.mockResolvedValue(
      expectedActiveReassignments,
    );

    const result =
      await reassignmentService.getIncomingReassignmentRequests(staffId);

    expect(
      mockReassignmentDb.getIncomingReassignmentRequests,
    ).toHaveBeenCalledWith(staffId);
    expect(result).toEqual(expectedActiveReassignments);
  });
});

describe("handleReassignmentRequest", () => {
  let reassignmentService: ReassignmentService;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockEmployeeService: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = 1;
  const reassignmentId = 2;

  beforeEach(() => {
    mockReassignmentDb = {
      getIncomingReassignmentRequests: jest.fn(),
      updateReassignmentStatus: jest.fn(),
    };
    mockEmployeeService = {
      getEmployee: jest.fn(),
    } as any;

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should approve the reassignment request", async () => {
    const reassignment = [
      { tempReportingManagerId: staffId, status: Status.PENDING },
    ];
    mockReassignmentDb.getIncomingReassignmentRequests.mockResolvedValue(
      reassignment,
    );

    await reassignmentService.handleReassignmentRequest(
      staffId,
      reassignmentId,
      Action.APPROVE,
    );

    expect(mockReassignmentDb.updateReassignmentStatus).toHaveBeenCalledWith(
      reassignmentId,
      Status.APPROVED,
    );
  });

  it("should reject the reassignment request", async () => {
    const reassignment = [
      { tempReportingManagerId: staffId, status: Status.PENDING },
    ];
    mockReassignmentDb.getIncomingReassignmentRequests.mockResolvedValue(
      reassignment,
    );

    await reassignmentService.handleReassignmentRequest(
      staffId,
      reassignmentId,
      Action.REJECT,
    );

    expect(mockReassignmentDb.updateReassignmentStatus).toHaveBeenCalledWith(
      reassignmentId,
      Status.REJECTED,
    );
  });

  it("should throw an error if reassignment request is not found", async () => {
    mockReassignmentDb.getIncomingReassignmentRequests.mockResolvedValue(null);

    await expect(
      reassignmentService.handleReassignmentRequest(
        staffId,
        reassignmentId,
        Action.APPROVE,
      ),
    ).rejects.toThrow("Reassignment request not found");
  });

  it("should throw an error if the staff member is not authorized", async () => {
    const reassignment = [
      { tempReportingManagerId: 99, status: Status.PENDING },
    ];
    mockReassignmentDb.getIncomingReassignmentRequests.mockResolvedValue(
      reassignment,
    );

    await expect(
      reassignmentService.handleReassignmentRequest(
        staffId,
        reassignmentId,
        Action.APPROVE,
      ),
    ).rejects.toThrow("Unauthorized to perform this action");
  });

  it("should throw an error if the request has already been processed", async () => {
    const reassignment = [
      { tempReportingManagerId: staffId, status: Status.APPROVED },
    ];
    mockReassignmentDb.getIncomingReassignmentRequests.mockResolvedValue(
      reassignment,
    );

    await expect(
      reassignmentService.handleReassignmentRequest(
        staffId,
        reassignmentId,
        Action.APPROVE,
      ),
    ).rejects.toThrow("This request has already been processed");
  });
});

describe("getSubordinateRequestsForTempManager", () => {
  let reassignmentService: ReassignmentService;
  let mockReassignmentDb: any;
  let mockRequestDb: any;
  let mockEmployeeService: any;
  let mockLogService: any;
  let mockNotificationService: any;

  const staffId = 1;

  beforeEach(() => {
    mockReassignmentDb = {
      getActiveReassignmentAsTempManager: jest.fn(),
    };
    mockRequestDb = {
      getAllSubordinatesRequests: jest.fn(),
    };

    reassignmentService = new ReassignmentService(
      mockReassignmentDb,
      mockRequestDb,
      mockEmployeeService,
      mockLogService,
      mockNotificationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return null if no reassignment found", async () => {
    mockReassignmentDb.getActiveReassignmentAsTempManager.mockResolvedValue(
      null,
    );

    const result =
      await reassignmentService.getSubordinateRequestsForTempManager(staffId);

    expect(result).toBeNull();
  });

  it("should return filtered requests for the subordinate within reassignment dates", async () => {
    const reassignment = {
      staffId: 2,
      startDate: "2024-01-01",
      endDate: "2024-01-10",
    };
    const subordinateRequests = [
      { status: Status.APPROVED, requestedDate: "2024-01-05" },
      { status: Status.APPROVED, requestedDate: "2024-01-15" },
      { status: Status.PENDING, requestedDate: "2024-01-12" },
    ];

    mockReassignmentDb.getActiveReassignmentAsTempManager.mockResolvedValue(
      reassignment,
    );
    mockRequestDb.getAllSubordinatesRequests.mockResolvedValue(
      subordinateRequests,
    );

    const result =
      await reassignmentService.getSubordinateRequestsForTempManager(staffId);

    expect(result).toEqual([
      { status: Status.APPROVED, requestedDate: "2024-01-05" },
      { status: Status.PENDING, requestedDate: "2024-01-12" },
    ]);
  });

  it("should return all pending requests even if no reassignment dates match", async () => {
    const reassignment = {
      staffId: 2,
      startDate: "2024-01-01",
      endDate: "2024-01-10",
    };
    const subordinateRequests = [
      { status: Status.APPROVED, requestedDate: "2024-01-15" },
      { status: Status.PENDING, requestedDate: "2024-01-12" },
    ];

    mockReassignmentDb.getActiveReassignmentAsTempManager.mockResolvedValue(
      reassignment,
    );
    mockRequestDb.getAllSubordinatesRequests.mockResolvedValue(
      subordinateRequests,
    );

    const result =
      await reassignmentService.getSubordinateRequestsForTempManager(staffId);

    expect(result).toEqual([
      { status: Status.PENDING, requestedDate: "2024-01-12" },
    ]);
  });
});
