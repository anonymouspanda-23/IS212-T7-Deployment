import Mailer from "@/config/mailer";
import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import ReassignmentDb from "@/database/ReassignmentDb";
import RequestDb from "@/database/RequestDb";
import WithdrawalDb from "@/database/WithdrawalDb";
import { Action, HttpStatusResponse, PerformedBy, Status } from "@/helpers";
import NotificationService from "@/services/NotificationService";
import ReassignmentService from "@/services/ReassignmentService";
import RequestService from "@/services/RequestService";
import WithdrawalService from "@/services/WithdrawalService";
import { mockRequestData, mockWithdrawalData } from "@/tests/mockData";
import { jest } from "@jest/globals";
import dayjs from "dayjs";
import nodemailer from "nodemailer";
import EmployeeService from "./EmployeeService";
import LogService from "./LogService";

describe("getWithdrawalRequest", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let notificationServiceMock: jest.Mocked<NotificationService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let withdrawalService: WithdrawalService;
  let withdrawalDbMock: jest.Mocked<WithdrawalDb>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;
    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    notificationServiceMock = new NotificationService(
      employeeServiceMock,
      mockMailer,
    ) as jest.Mocked<NotificationService>;

    logDbMock = new LogDb() as jest.Mocked<LogDb>;
    logServiceMock = new LogService(
      logDbMock,
      employeeServiceMock,
    ) as jest.Mocked<LogService>;

    reassignmentServiceMock = new ReassignmentService(
      reassignmentDbMock,
      requestDbMock,
      employeeServiceMock,
      logServiceMock,
      notificationServiceMock,
    ) as jest.Mocked<ReassignmentService>;
    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
    withdrawalDbMock = new WithdrawalDb() as jest.Mocked<WithdrawalDb>;

    withdrawalService = new WithdrawalService(
      logServiceMock,
      withdrawalDbMock,
      requestService,
      reassignmentServiceMock,
      employeeServiceMock,
      notificationServiceMock,
    );
    withdrawalDbMock.getWithdrawalRequest = jest.fn();
    jest.resetAllMocks();
  });

  it("should return array of withdrawal requests for a valid staffId", async () => {
    const { staffId } = mockWithdrawalData;
    withdrawalDbMock.getWithdrawalRequest.mockResolvedValue([
      mockWithdrawalData,
    ] as any);
    const result = await withdrawalService.getWithdrawalRequest(staffId);
    expect(result).toEqual([mockWithdrawalData] as any);
  });

  it("should return null for an invalid staffId", async () => {
    withdrawalDbMock.getWithdrawalRequest.mockResolvedValue([]);
    const result = await withdrawalService.getWithdrawalRequest(1044);
    expect(result).toEqual(null);
  });
});

describe("withdrawRequest", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let notificationServiceMock: jest.Mocked<NotificationService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let withdrawalService: WithdrawalService;
  let withdrawalDbMock: jest.Mocked<WithdrawalDb>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;
    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    notificationServiceMock = new NotificationService(
      employeeServiceMock,
      mockMailer,
    ) as jest.Mocked<NotificationService>;

    logDbMock = new LogDb() as jest.Mocked<LogDb>;
    logServiceMock = new LogService(
      logDbMock,
      employeeServiceMock,
    ) as jest.Mocked<LogService>;

    reassignmentServiceMock = new ReassignmentService(
      reassignmentDbMock,
      requestDbMock,
      employeeServiceMock,
      logServiceMock,
      notificationServiceMock,
    ) as jest.Mocked<ReassignmentService>;
    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
    withdrawalDbMock = new WithdrawalDb() as jest.Mocked<WithdrawalDb>;

    withdrawalService = new WithdrawalService(
      logServiceMock,
      withdrawalDbMock,
      requestService,
      reassignmentServiceMock,
      employeeServiceMock,
      notificationServiceMock,
    );
    withdrawalDbMock.withdrawRequest = jest.fn();
    requestDbMock.getApprovedRequestByRequestId = jest.fn();
    withdrawalDbMock.getWithdrawalRequest = jest.fn();
    jest.resetAllMocks();
  });

  it("should return null for a valid requestId with existing pending / approved withdrawal", async () => {
    const { requestId } = mockWithdrawalData;
    requestDbMock.getApprovedRequestByRequestId.mockResolvedValue([
      mockRequestData.APPROVED,
    ] as any);
    withdrawalDbMock.getWithdrawalRequest.mockResolvedValue([
      mockWithdrawalData,
    ] as any);
    withdrawalDbMock.withdrawRequest.mockResolvedValue(HttpStatusResponse.OK);
    const result = await withdrawalService.withdrawRequest(requestId);
    expect(result).toEqual(null);
  });

  it("should return null for an invalid requestId", async () => {
    requestDbMock.getApprovedRequestByRequestId.mockResolvedValue([] as any);
    const result = await withdrawalService.getWithdrawalRequest(1044);
    expect(result).toEqual(null);
  });
});

describe("getOwnWithdrawalRequests", () => {
  let withdrawalService: WithdrawalService;
  let requestService: RequestService;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let logServiceMock: any;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let withdrawalDbMock: any;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    withdrawalDbMock = {
      getOwnWithdrawalRequests: jest.fn(),
    };
    logServiceMock = {
      logRequestHelper: jest.fn(),
    };

    withdrawalService = new WithdrawalService(
      logServiceMock,
      withdrawalDbMock,
      requestService,
      reassignmentServiceMock,
      employeeServiceMock,
      notificationServiceMock,
    );
  });

  it("should retrieve withdrawal requests and log the request when there are own requests", async () => {
    const staffId = 1;
    const ownRequests = [
      {
        staffName: "John Doe",
        dept: "Finance",
        position: "Accountant",
        reportingManager: 2,
        managerName: "Jane Smith",
      },
    ];

    withdrawalDbMock.getOwnWithdrawalRequests.mockResolvedValueOnce(
      ownRequests,
    );

    const result = await withdrawalService.getOwnWithdrawalRequests(staffId);

    expect(result).toEqual(ownRequests);
    expect(withdrawalDbMock.getOwnWithdrawalRequests).toHaveBeenCalledWith(
      staffId,
    );
    expect(logServiceMock.logRequestHelper).toHaveBeenCalledWith({
      performedBy: staffId,
      requestType: "WITHDRAWAL",
      action: Action.RETRIEVE,
      staffName: ownRequests[0].staffName,
      dept: ownRequests[0].dept,
      position: ownRequests[0].position,
      reportingManagerId: ownRequests[0].reportingManager,
      managerName: ownRequests[0].managerName,
    });
  });

  it("should return an empty array and not log when there are no own requests", async () => {
    const staffId = 1;

    withdrawalDbMock.getOwnWithdrawalRequests.mockResolvedValueOnce([]);

    const result = await withdrawalService.getOwnWithdrawalRequests(staffId);

    expect(result).toEqual([]);
    expect(withdrawalDbMock.getOwnWithdrawalRequests).toHaveBeenCalledWith(
      staffId,
    );
    expect(logServiceMock.logRequestHelper).not.toHaveBeenCalled();
  });
});

describe("getWithdrawalRequestById", () => {
  let withdrawalService: WithdrawalService;
  let requestService: RequestService;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let logServiceMock: any;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let withdrawalDbMock: any;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    withdrawalDbMock = {
      getWithdrawalRequestById: jest.fn(),
    };

    withdrawalService = new WithdrawalService(
      logServiceMock,
      withdrawalDbMock,
      requestService,
      reassignmentServiceMock,
      employeeServiceMock,
      notificationServiceMock,
    );
  });

  it("should return the withdrawal request when found", async () => {
    const withdrawalId = 1;
    const mockRequest = {
      id: withdrawalId,
      staffName: "John Doe",
      dept: "Finance",
      position: "Accountant",
    };

    withdrawalDbMock.getWithdrawalRequestById.mockResolvedValueOnce(
      mockRequest,
    );

    const result =
      await withdrawalService.getWithdrawalRequestById(withdrawalId);

    expect(result).toEqual(mockRequest);
    expect(withdrawalDbMock.getWithdrawalRequestById).toHaveBeenCalledWith(
      withdrawalId,
    );
  });

  it("should return null when the withdrawal request is not found", async () => {
    const withdrawalId = 1;

    withdrawalDbMock.getWithdrawalRequestById.mockResolvedValueOnce(null);

    const result =
      await withdrawalService.getWithdrawalRequestById(withdrawalId);

    expect(result).toBeNull();
    expect(withdrawalDbMock.getWithdrawalRequestById).toHaveBeenCalledWith(
      withdrawalId,
    );
  });
});

describe("approveWithdrawalRequest", () => {
  let withdrawalService: WithdrawalService;
  let requestServiceMock: any;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let logServiceMock: any;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let withdrawalDbMock: any;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    withdrawalDbMock = {
      approveWithdrawalRequest: jest.fn(),
    };

    requestServiceMock = {
      setWithdrawnStatus: jest.fn(),
    };

    reassignmentServiceMock = {
      getReassignmentActive: jest.fn(),
    } as any;

    employeeServiceMock = {
      getEmployee: jest.fn(),
    } as any;

    logServiceMock = {
      logRequestHelper: jest.fn(),
    };

    withdrawalService = new WithdrawalService(
      logServiceMock,
      withdrawalDbMock,
      requestServiceMock,
      reassignmentServiceMock,
      employeeServiceMock,
      notificationServiceMock,
    );
  });

  it("should return null if the request is not found or not pending", async () => {
    const performedBy = 2;
    const withdrawalId = 1;

    withdrawalService.getWithdrawalRequestById = jest
      .fn()
      .mockResolvedValueOnce(null as never) as any;

    const result = await withdrawalService.approveWithdrawalRequest(
      performedBy,
      withdrawalId,
    );

    expect(result).toBeNull();
  });

  it("should return null if the performer is not the reporting manager and there is no active reassignment", async () => {
    const performedBy = 2;
    const withdrawalId = 1;
    const mockRequest = {
      id: withdrawalId,
      status: Status.PENDING,
      requestId: 100,
      reportingManager: 1,
    };

    withdrawalService.getWithdrawalRequestById = jest
      .fn()
      .mockResolvedValueOnce(mockRequest as never) as any;
    reassignmentServiceMock.getReassignmentActive.mockResolvedValueOnce(null);

    const result = await withdrawalService.approveWithdrawalRequest(
      performedBy,
      withdrawalId,
    );

    expect(result).toBeNull();
  });

  it("should return null if approving the withdrawal request fails", async () => {
    const performedBy = 2;
    const withdrawalId = 1;
    const mockRequest = {
      id: withdrawalId,
      status: Status.PENDING,
      requestId: 100,
      reportingManager: 1,
    };

    withdrawalService.getWithdrawalRequestById = jest
      .fn()
      .mockResolvedValueOnce(mockRequest as never) as any;
    withdrawalDbMock.approveWithdrawalRequest.mockResolvedValueOnce(false);

    const result = await withdrawalService.approveWithdrawalRequest(
      performedBy,
      withdrawalId,
    );

    expect(result).toBeNull();
  });

  it("should return null if setting the withdrawn status fails", async () => {
    const performedBy = 2;
    const withdrawalId = 1;
    const mockRequest = {
      id: withdrawalId,
      status: Status.PENDING,
      requestId: 100,
      reportingManager: 1,
    };

    withdrawalService.getWithdrawalRequestById = jest
      .fn()
      .mockResolvedValueOnce(mockRequest as never) as any;
    withdrawalDbMock.approveWithdrawalRequest.mockResolvedValueOnce(true);
    requestServiceMock.setWithdrawnStatus.mockReturnValueOnce(false);

    const result = await withdrawalService.approveWithdrawalRequest(
      performedBy,
      withdrawalId,
    );

    expect(result).toBeNull();
  });
});

describe("updateWithdrawalStatusToExpired", () => {
  let withdrawalService: WithdrawalService;
  let withdrawalDbMock: any;
  let logServiceMock: any;
  let requestServiceMock: any;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    withdrawalDbMock = {
      updateWithdrawalStatusToExpired: jest.fn(),
    };

    logServiceMock = {
      logRequestHelper: jest.fn(),
    };

    employeeServiceMock = {
      getEmployee: jest.fn(),
    } as any;

    notificationServiceMock = {
      notify: jest.fn(),
    } as any;

    withdrawalService = new WithdrawalService(
      logServiceMock,
      withdrawalDbMock,
      requestServiceMock,
      reassignmentServiceMock,
      employeeServiceMock,
      notificationServiceMock,
    );
  });

  it("should update withdrawal status, notify the employee, and log the action", async () => {
    const mockRequest = [
      {
        requestId: "123",
        requestedDate: "2024-10-26T10:00:00Z",
        requestType: "SomeType",
        staffId: "staff123",
      },
    ];
    const mockEmployee = {
      email: "employee@example.com",
    };

    withdrawalDbMock.updateWithdrawalStatusToExpired.mockResolvedValue(
      mockRequest,
    );
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee as any);

    await withdrawalService.updateWithdrawalStatusToExpired();

    expect(withdrawalDbMock.updateWithdrawalStatusToExpired).toHaveBeenCalled();

    expect(employeeServiceMock.getEmployee).toHaveBeenCalledWith(
      mockRequest[0].staffId,
    );

    expect(notificationServiceMock.notify).toHaveBeenCalledWith(
      mockEmployee.email,
      `[WITHDRAWAL] Withdrawal Expired`,
      `Your request withdrawal has expired. Please contact your reporting manager for more details.`,
      null,
      [
        [
          dayjs(mockRequest[0].requestedDate).format("YYYY-MM-DD"),
          mockRequest[0].requestType,
        ],
      ],
    );

    expect(logServiceMock.logRequestHelper).toHaveBeenCalledWith({
      performedBy: PerformedBy.SYSTEM,
      requestId: mockRequest[0].requestId,
      requestType: "WITHDRAWAL",
      action: Action.EXPIRE,
      dept: PerformedBy.PERFORMED_BY_SYSTEM,
      position: PerformedBy.PERFORMED_BY_SYSTEM,
    });
  });

  it("should not proceed with notification and logging if no withdrawal request is found", async () => {
    withdrawalDbMock.updateWithdrawalStatusToExpired.mockResolvedValue(null);

    await withdrawalService.updateWithdrawalStatusToExpired();

    expect(employeeServiceMock.getEmployee).not.toHaveBeenCalled();
    expect(notificationServiceMock.notify).not.toHaveBeenCalled();
    expect(logServiceMock.logRequestHelper).not.toHaveBeenCalled();
  });

  it("should not log the action if no withdrawal requests are returned", async () => {
    withdrawalDbMock.updateWithdrawalStatusToExpired.mockResolvedValueOnce(
      null,
    );

    await withdrawalService.updateWithdrawalStatusToExpired();

    expect(withdrawalDbMock.updateWithdrawalStatusToExpired).toHaveBeenCalled();
    expect(logServiceMock.logRequestHelper).not.toHaveBeenCalled();
  });
});
