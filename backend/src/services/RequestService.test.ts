import UtilsController from "@/controllers/UtilsController";
import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import RequestDb from "@/database/RequestDb";
import {
  AccessControl,
  Action,
  EmailHeaders,
  errMsg,
  HttpStatusResponse,
  PerformedBy,
  Role,
} from "@/helpers";
import { initializeCounter } from "@/helpers/counter";
import * as dateUtils from "@/helpers/date";
import { dayWeekAfter } from "@/helpers/unitTestFunctions";
import { checkUserRolePermission } from "@/middleware/checkUserRolePermission";
import RequestService from "@/services/RequestService";
import { middlewareMockData } from "@/tests/middlewareMockData";
import { generateMockEmployeeTest, mockRequestData } from "@/tests/mockData";
import { jest } from "@jest/globals";
import dayjs from "dayjs";
import { Context, Next } from "koa";
import EmployeeService from "./EmployeeService";
import { IEmployee } from "@/models/Employee";
import { Mailer } from "@/config/mailer";
import nodemailer from "nodemailer";
import LogService from "./LogService";
import ReassignmentDb from "@/database/ReassignmentDb";
import ReassignmentService from "@/services/ReassignmentService";
import NotificationService from "@/services/NotificationService";

beforeAll(() => {
  initializeCounter("requestId");
});

describe("postRequest", () => {
  let logDbMock: jest.Mocked<LogDb>;
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockEmployee: jest.Mocked<IEmployee>;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let logServiceMock: jest.Mocked<LogService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  const mondayWeekBefore = dayjs()
    .tz("Asia/Singapore")
    .day(1)
    .subtract(1, "week")
    .format("YYYY-MM-DD");

  type ResponseDates = {
    successDates: [string, string][];
    noteDates: [string, string][];
    errorDates: [string, string][];
    weekendDates: [string, string][];
    pastDates: [string, string][];
    pastDeadlineDates: [string, string][];
    duplicateDates: [string, string][];
    insertErrorDates: [string, string][];
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    mockEmployee = await generateMockEmployeeTest();
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

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
    logServiceMock.logRequestHelper = jest.fn();
    requestDbMock.postRequest = jest.fn();
    requestDbMock.getPendingOrApprovedRequests = jest.fn();
    employeeServiceMock.getEmployee = jest.fn();
    notificationServiceMock.pushRequestSentNotification = jest.fn();
    jest.mock("@/helpers/date");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return weekendDates array for weekend inputted", async () => {
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [[dayWeekAfter(6), "FULL"]],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [[dayWeekAfter(6), "FULL"]],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };
    mockRequestData.PENDING.requestedDate = String(new Date(dayWeekAfter(2)));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.PENDING,
    ] as any);

    employeeServiceMock.getEmployee.mockResolvedValue(
      mockEmployee as IEmployee,
    );
    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(0);
  });

  it("should return pastDates array for past date inputted", async () => {
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [[mondayWeekBefore, "FULL"]],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [[mondayWeekBefore, "FULL"]],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };
    mockRequestData.PENDING.requestedDate = String(new Date(dayWeekAfter(2)));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.PENDING,
    ] as any);

    employeeServiceMock.getEmployee.mockResolvedValue(
      mockEmployee as IEmployee,
    );
    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(0);
  });

  it("should return successDates for successful date inputted", async () => {
    const emailSubject = EmailHeaders.REQUEST_SENT;
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [[dayWeekAfter(3), "FULL"]],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [[dayWeekAfter(3), "FULL"]],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };
    mockRequestData.testing.requestedDate = new Date(dayWeekAfter(2));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.testing,
    ] as any);

    requestDbMock.postRequest.mockResolvedValue(true);
    employeeServiceMock.getEmployee.mockResolvedValue(
      mockEmployee as IEmployee,
    );
    const { email, reportingManager } = mockEmployee!;

    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(1);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledWith(
      emailSubject,
      email,
      reportingManager,
      "APPLICATION",
      expectedResponse.successDates,
      requestDetails.reason,
    );
  });

  it("should return duplicateDates array and successDates for duplicate date inputted (successful date)", async () => {
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [
        [dayWeekAfter(3), "FULL"],
        [dayWeekAfter(3), "AM"],
      ],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [[dayWeekAfter(3), "FULL"]],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [[dayWeekAfter(3), "AM"]],
      insertErrorDates: [],
    };
    mockRequestData.testing.requestedDate = new Date(dayWeekAfter(2));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.testing,
    ] as any);
    requestDbMock.postRequest.mockResolvedValue(true);
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee as any);
    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(1);
  });

  it("should return noteDates array and successDates for successful dates inputted with >2 existing requests for that week", async () => {
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [
        [dayWeekAfter(4), "FULL"],
        [dayWeekAfter(3), "FULL"],
      ],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [
        [dayWeekAfter(4), "FULL"],
        [dayWeekAfter(3), "FULL"],
      ],
      noteDates: [[dayWeekAfter(3), "FULL"]],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };
    mockRequestData.testing.requestedDate = new Date(dayWeekAfter(2));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.testing,
    ] as any);
    requestDbMock.postRequest.mockResolvedValue(true);
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee as any);
    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(1);
  });

  it("should return insertError array when successful dates inputted but with DB Error", async () => {
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [[dayWeekAfter(3), "FULL"]],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [[dayWeekAfter(3), "FULL"]],
    };
    mockRequestData.testing.requestedDate = new Date(dayWeekAfter(2));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.testing,
    ] as any);
    requestDbMock.postRequest.mockResolvedValue(false);
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee as any);
    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(0);
  });

  it("should return pastDeadlineDates array when dates inputted has past deadline", async () => {
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [[dayWeekAfter(1), "FULL"]],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [[dayWeekAfter(1), "FULL"]],
      duplicateDates: [],
      insertErrorDates: [],
    };
    mockRequestData.testing.requestedDate = new Date(dayWeekAfter(2));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.testing,
    ] as any);

    employeeServiceMock.getEmployee.mockResolvedValue(
      mockEmployee as IEmployee,
    );
    jest.spyOn(dateUtils, "checkLatestDate").mockReturnValue(true);
    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(0);
  });

  it("should return errorDates array when there is already a pending / approved request for that date", async () => {
    const requestDetails = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "Development",
      requestedDates: [[dayWeekAfter(4), "FULL"]],
      reason: "Take care of mother",
    };

    const expectedResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [[dayWeekAfter(4), "FULL"]],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };
    mockRequestData.testing.requestedDate = new Date(dayWeekAfter(4));
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.testing,
    ] as any);

    employeeServiceMock.getEmployee.mockResolvedValue(
      mockEmployee as IEmployee,
    );
    const result = await requestService.postRequest(requestDetails);
    expect(result).toEqual(expectedResponse);
    expect(
      notificationServiceMock.pushRequestSentNotification,
    ).toHaveBeenCalledTimes(0);
  });
});

describe("getPendingOrApprovedRequests", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

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
    requestDbMock.getPendingOrApprovedRequests = jest.fn();
    jest.resetAllMocks();
  });

  it("should return array of requests for a valid staffId", async () => {
    const { staffId } = mockRequestData.PENDING;
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([
      mockRequestData.PENDING,
    ] as any);
    const result = await requestService.getPendingOrApprovedRequests(staffId);
    expect(result).toEqual([mockRequestData.PENDING] as any);
  });

  it("should return [] for an invalid staffId", async () => {
    requestDbMock.getPendingOrApprovedRequests.mockResolvedValue([]);
    const result = await requestService.getPendingOrApprovedRequests(1044);
    expect(result).toEqual([]);
  });
});

describe("cancel pending requests", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

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
    /**
     * Mock Database Calls
     */
    requestDbMock.cancelPendingRequests = jest.fn();
    employeeDbMock.getEmployee = jest.fn() as any;
    employeeServiceMock.getEmployee = jest.fn() as any;
    UtilsController.throwAPIError = jest.fn();

    jest.resetAllMocks();
  });

  it("should return status not modified if there is no pending request", async () => {
    const { staffId, requestId } = mockRequestData.APPROVED;
    requestDbMock.cancelPendingRequests.mockResolvedValue(null);
    const result = await requestService.cancelPendingRequests(
      staffId,
      requestId,
    );
    expect(result).toEqual(null);
  });

  it("should cancel user's pending request", async () => {
    const { staffId, requestId } = mockRequestData.PENDING;
    requestDbMock.cancelPendingRequests.mockResolvedValue(
      mockRequestData.APPROVED as any,
    );
    employeeServiceMock.getEmployee.mockResolvedValue({
      staffFName: "Janice",
      staffLName: "Chan",
      reportingManager: 140894,
      reportingManagerName: "Rahim Khalid",
    } as IEmployee);

    const result = await requestService.cancelPendingRequests(
      staffId,
      requestId,
    );
    expect(result).toEqual(HttpStatusResponse.OK);
  });
});

describe("get pending requests", () => {
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let ctx: Context;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let next: Next;
  const checkUserRolePermMiddleware = checkUserRolePermission(
    AccessControl.VIEW_PENDING_REQUEST,
  );

  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

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

    /**
     * Mock Database Calls
     */
    requestDbMock.getAllSubordinatesRequests = jest.fn();
    next = jest.fn() as any;
    EmployeeService.prototype.getEmployee = jest.fn() as any;
    UtilsController.throwAPIError = jest.fn();

    jest.resetAllMocks();
  });

  it("should not return pending requests because of missing headers", async () => {
    ctx = {
      request: {
        header: {},
      },
    } as unknown as Context;
    ctx.request.header.id = undefined;

    await checkUserRolePermMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).toHaveBeenCalledWith(
      ctx,
      errMsg.MISSING_HEADER,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should not return pending requests because user is unauthorised", async () => {
    ctx = {
      request: {
        header: {},
      },
    } as unknown as Context;
    ctx.request.header.id = String(middlewareMockData.Engineering.staffId);

    employeeServiceMock.getEmployee.mockResolvedValue(
      middlewareMockData.Engineering as any,
    );
    await checkUserRolePermMiddleware(ctx, next);
    expect(UtilsController.throwAPIError).toHaveBeenCalledWith(
      ctx,
      errMsg.UNAUTHORISED,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return user's direct subordinates pending requests", async () => {
    const { reportingManager } = mockRequestData.PENDING;
    requestDbMock.getAllSubordinatesRequests.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    const result =
      await requestService.getAllSubordinatesRequests(reportingManager);
    expect(result).toEqual(mockRequestData.PENDING as any);
  });

  it("should still return user's direct subordinates requests that have been approved", async () => {
    const { reportingManager } = mockRequestData.APPROVED;
    requestDbMock.getAllSubordinatesRequests.mockResolvedValue(
      mockRequestData.APPROVED as any,
    );
    const result =
      await requestService.getAllSubordinatesRequests(reportingManager);
    expect(result).toEqual(mockRequestData.APPROVED);
  });
});

describe("get my schedule", () => {
  let requestService: RequestService;
  let logServiceMock: any;
  let employeeServiceMock: any;
  let requestDbMock: any;
  let reassignmentServiceMock: any;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let mockMailer: jest.Mocked<Mailer>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    employeeServiceMock = {
      getEmployee: jest.fn(),
    };
    requestDbMock = {
      getMySchedule: jest.fn(),
    };

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

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
  });

  it("should return USER_DOES_NOT_EXIST when employee does not exist", async () => {
    const myId = 1;
    employeeServiceMock.getEmployee.mockResolvedValue(null);

    const result = await requestService.getMySchedule(myId);
    expect(result).toBe(errMsg.USER_DOES_NOT_EXIST);
  });

  it("should return REQUESTS_NOT_FOUND when no schedule is found", async () => {
    const myId = 1;
    employeeServiceMock.getEmployee.mockResolvedValue({ id: myId });
    requestDbMock.getMySchedule.mockResolvedValue([]);

    const result = await requestService.getMySchedule(myId);
    expect(result).toBe(errMsg.REQUESTS_NOT_FOUND);
  });

  it("should return the schedule when found", async () => {
    const myId = 1;
    const mockSchedule = [{ id: 1, date: "2024-10-21", task: "Meeting" }];
    employeeServiceMock.getEmployee.mockResolvedValue({ id: myId });
    requestDbMock.getMySchedule.mockResolvedValue(mockSchedule);

    const result = await requestService.getMySchedule(myId);
    expect(result).toEqual(mockSchedule);
  });
});

describe("update request initiatedWithdrawal vlue", () => {
  let requestService: RequestService;
  let logServiceMock: any;
  let employeeServiceMock: any;
  let requestDbMock: any;
  let reassignmentServiceMock: any;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let mockMailer: jest.Mocked<Mailer>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    employeeServiceMock = {
      getEmployee: jest.fn(),
    };
    requestDbMock = {
      updateRequestinitiatedWithdrawalValue: jest.fn(),
    };

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

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
  });

  it("should update the withdrawal value and return the result", async () => {
    const requestId = 1;
    const mockUpdateResult = { success: true };

    requestDbMock.updateRequestinitiatedWithdrawalValue.mockResolvedValue(
      mockUpdateResult,
    );

    const result =
      await requestService.updateRequestinitiatedWithdrawalValue(requestId);

    expect(result).toEqual(mockUpdateResult);
    expect(
      requestDbMock.updateRequestinitiatedWithdrawalValue,
    ).toHaveBeenCalledWith(requestId);
  });

  it("should handle error scenarios when update fails", async () => {
    const requestId = 2;
    const mockError = new Error("Update failed");

    requestDbMock.updateRequestinitiatedWithdrawalValue.mockRejectedValue(
      mockError,
    );

    await expect(
      requestService.updateRequestinitiatedWithdrawalValue(requestId),
    ).rejects.toThrow("Update failed");
    expect(
      requestDbMock.updateRequestinitiatedWithdrawalValue,
    ).toHaveBeenCalledWith(requestId);
  });
});

describe("get schedule", () => {
  let requestService: RequestService;
  let logServiceMock: any;
  let employeeServiceMock: any;
  let requestDbMock: any;
  let reassignmentServiceMock: any;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let mockMailer: jest.Mocked<Mailer>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    logServiceMock = {
      logRequestHelper: jest.fn(),
    };

    employeeServiceMock = {
      getEmployee: jest.fn(),
      getAllDeptTeamCount: jest.fn(),
    };

    requestDbMock = {
      getAllDeptSchedule: jest.fn(),
      getTeamSchedule: jest.fn(),
    };

    reassignmentServiceMock = {
      getActiveReassignmentAsTempManager: jest.fn(),
    };

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

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
  });

  it("should return USER_DOES_NOT_EXIST when employee does not exist", async () => {
    const staffId = 1;
    employeeServiceMock.getEmployee.mockResolvedValue(null);

    const result = await requestService.getSchedule(staffId);

    expect(result).toBe(errMsg.USER_DOES_NOT_EXIST);
  });

  it("should return schedule for manager or HR", async () => {
    const staffId = 2;
    const employee = {
      role: Role.Manager,
      position: "Manager",
      reportingManager: 3,
      dept: "Sales",
      staffFName: "John",
      staffLName: "Doe",
      reportingManagerName: "Jane Smith",
    };

    const allDeptTeamCount = {
      Sales: {
        teams: {
          Manager: [],
        },
      },
    };

    const wfhStaff = {
      Sales: [],
    };

    const activeReassignment = {
      active: true,
      originalManagerDept: "Sales",
    };

    employeeServiceMock.getEmployee.mockResolvedValue(employee);
    employeeServiceMock.getAllDeptTeamCount.mockResolvedValue(allDeptTeamCount);
    requestDbMock.getAllDeptSchedule.mockResolvedValue(wfhStaff);
    reassignmentServiceMock.getActiveReassignmentAsTempManager.mockResolvedValue(
      activeReassignment,
    );

    const result = await requestService.getSchedule(staffId);

    expect(result).toEqual({
      Sales: {
        teams: {
          Manager: [],
        },
        wfhStaff: [],
        isTempTeam: true,
      },
    });

    expect(logServiceMock.logRequestHelper).toHaveBeenCalledWith({
      performedBy: staffId,
      requestType: "APPLICATION",
      action: Action.RETRIEVE,
      staffName: "John Doe",
      dept: "Sales",
      position: "Manager",
    });
  });

  it("should assign WFH staff correctly when department has WFH staff", async () => {
    const staffId = 3;
    const employee = {
      role: Role.Manager,
      position: "Manager",
      reportingManager: 4,
      dept: "Marketing",
      staffFName: "Alice",
      staffLName: "Johnson",
      reportingManagerName: "Bob Brown",
    };

    const allDeptTeamCount = {
      Marketing: {
        teams: {
          Manager: [],
        },
      },
    };

    const wfhStaff = {
      Marketing: [
        { name: "Charlie Black", position: "Developer" },
        { name: "Diana White", position: "Designer" },
      ],
    };

    const activeReassignment = {
      active: false,
      originalManagerDept: "Marketing",
    };

    employeeServiceMock.getEmployee.mockResolvedValue(employee);
    employeeServiceMock.getAllDeptTeamCount.mockResolvedValue(allDeptTeamCount);
    requestDbMock.getAllDeptSchedule.mockResolvedValue(wfhStaff);
    reassignmentServiceMock.getActiveReassignmentAsTempManager.mockResolvedValue(
      activeReassignment,
    );

    const result = await requestService.getSchedule(staffId);

    expect(result).toEqual({
      Marketing: {
        teams: {
          Manager: [],
        },
        wfhStaff: [
          { name: "Charlie Black", position: "Developer" },
          { name: "Diana White", position: "Designer" },
        ],
      },
    });

    expect(logServiceMock.logRequestHelper).toHaveBeenCalledWith({
      performedBy: staffId,
      requestType: "APPLICATION",
      action: Action.RETRIEVE,
      staffName: "Alice Johnson",
      dept: "Marketing",
      position: "Manager",
    });
  });

  it("should return schedule for regular staff", async () => {
    const staffId = 3;
    const employee = {
      role: Role.Staff,
      position: "Sales Rep",
      reportingManager: 4,
      dept: "Sales",
      staffFName: "Alice",
      staffLName: "Johnson",
      reportingManagerName: "Bob Brown",
    };

    const allDeptTeamCount = {
      Sales: {
        teams: {
          "Sales Rep": [],
        },
      },
    };

    const wfhStaff: any = [];

    employeeServiceMock.getEmployee.mockResolvedValue(employee);
    employeeServiceMock.getAllDeptTeamCount.mockResolvedValue(allDeptTeamCount);
    requestDbMock.getTeamSchedule.mockResolvedValue(wfhStaff);

    const result = await requestService.getSchedule(staffId);

    expect(result).toEqual({
      Sales: {
        teams: {
          "Sales Rep": [],
        },
        wfhStaff: [],
      },
    });

    expect(logServiceMock.logRequestHelper).toHaveBeenCalledWith({
      performedBy: staffId,
      requestType: "APPLICATION",
      action: Action.RETRIEVE,
      staffName: "Alice Johnson",
      reportingManagerId: 4,
      managerName: "Bob Brown",
      dept: "Sales",
      position: "Sales Rep",
    });
  });
});

describe("get approved request by requestId", () => {
  let requestService: RequestService;
  let logServiceMock: any;
  let employeeServiceMock: any;
  let requestDbMock: any;
  let reassignmentServiceMock: any;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let mockMailer: jest.Mocked<Mailer>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    logServiceMock = {
      logRequestHelper: jest.fn(),
    };

    employeeServiceMock = {
      getEmployee: jest.fn(),
    };

    requestDbMock = {
      getApprovedRequestByRequestId: jest.fn(),
    };

    reassignmentServiceMock = {
      getActiveReassignmentAsTempManager: jest.fn(),
    };

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

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
  });

  it("should return request details when a valid request ID is provided", async () => {
    const requestId = 1;
    const mockRequestDetail = { id: requestId, status: "Approved" };

    requestDbMock.getApprovedRequestByRequestId.mockResolvedValue(
      mockRequestDetail,
    );

    const result =
      await requestService.getApprovedRequestByRequestId(requestId);

    expect(result).toEqual(mockRequestDetail);
    expect(requestDbMock.getApprovedRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });

  it("should return null or undefined if no request is found for the given request ID", async () => {
    const requestId = 2;

    requestDbMock.getApprovedRequestByRequestId.mockResolvedValue(null);

    const result =
      await requestService.getApprovedRequestByRequestId(requestId);

    expect(result).toBeNull();
    expect(requestDbMock.getApprovedRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });

  it("should handle errors when the request database call fails", async () => {
    const requestId = 3;
    const mockError = new Error("Database error");

    requestDbMock.getApprovedRequestByRequestId.mockRejectedValue(mockError);

    await expect(
      requestService.getApprovedRequestByRequestId(requestId),
    ).rejects.toThrow("Database error");
    expect(requestDbMock.getApprovedRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });
});

describe("get own pending requests", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

    logDbMock = new LogDb() as jest.Mocked<LogDb>;
    logServiceMock = new LogService(
      logDbMock,
      employeeServiceMock,
    ) as jest.Mocked<LogService>;

    notificationServiceMock = new NotificationService(
      employeeServiceMock,
      mockMailer,
    ) as jest.Mocked<NotificationService>;

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );

    reassignmentServiceMock = new ReassignmentService(
      reassignmentDbMock,
      requestDbMock,
      employeeServiceMock,
      logServiceMock,
      notificationServiceMock,
    ) as jest.Mocked<ReassignmentService>;

    /**
     * Mock Database Calls
     */
    requestDbMock.getOwnPendingRequests = jest.fn();
    jest.resetAllMocks();
  });

  it("should return user's pending requests", async () => {
    const { staffId } = mockRequestData.PENDING;
    requestDbMock.getOwnPendingRequests.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    const result = await requestService.getOwnPendingRequests(staffId);
    expect(result).toEqual(mockRequestData.PENDING as any);
  });

  it("should not return user's requests that have been approved", async () => {
    const { staffId } = mockRequestData.APPROVED;
    requestDbMock.getOwnPendingRequests.mockResolvedValue([]);
    const result = await requestService.getOwnPendingRequests(staffId);
    expect(result).toEqual([]);
  });
});

describe("reject pending requests", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockEmployee: any;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    mockEmployee = await generateMockEmployeeTest();
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

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

    notificationServiceMock = new NotificationService(
      employeeServiceMock,
      mockMailer,
    ) as jest.Mocked<NotificationService>;

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );

    requestDbMock.getPendingRequestByRequestId = jest.fn();
    requestDbMock.rejectRequest = jest.fn();

    EmployeeService.prototype.getEmployee = jest.fn() as any;
    ReassignmentService.prototype.getReassignmentActive = jest.fn() as any;
    UtilsController.throwAPIError = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return status not modified if there is no pending request", async () => {
    const { reportingManager, requestId, reason } = mockRequestData.APPROVED;
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(null);
    const result = await requestService.rejectRequest(
      reportingManager,
      requestId,
      reason,
    );
    expect(result).toEqual(null);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });

  it("should reject user's pending request", async () => {
    const { reportingManager, requestId, reason } = mockRequestData.PENDING;
    requestDbMock.rejectRequest.mockResolvedValue(
      mockRequestData.REJECTED as any,
    );
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee as any);
    const result = await requestService.rejectRequest(
      reportingManager,
      requestId,
      reason,
    );
    expect(result).toEqual(HttpStatusResponse.OK);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
    expect(EmployeeService.prototype.getEmployee).toHaveBeenCalledWith(
      mockRequestData.PENDING.staffId,
    );
  });

  it("should return status not modified if employee not found", async () => {
    const { reportingManager, requestId, reason } = mockRequestData.PENDING;
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    employeeServiceMock.getEmployee.mockResolvedValue(null);
    const result = await requestService.rejectRequest(
      reportingManager,
      requestId,
      reason,
    );
    expect(result).toEqual(null);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });

  it("should return null if performedBy is not authorized", async () => {
    const { reportingManager, requestId, reason } = mockRequestData.PENDING;
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    mockEmployee.reportingManager = null;
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee);
    const result = await requestService.rejectRequest(
      reportingManager,
      requestId,
      reason,
    );
    expect(result).toEqual(null);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });
});

describe("approve pending requests", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockEmployee: any;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    mockEmployee = await generateMockEmployeeTest();
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

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

    notificationServiceMock = new NotificationService(
      employeeServiceMock,
      mockMailer,
    ) as jest.Mocked<NotificationService>;

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
    requestDbMock.getPendingRequestByRequestId = jest.fn();
    requestDbMock.approveRequest = jest.fn();
    EmployeeService.prototype.getEmployee = jest.fn() as any;
    UtilsController.throwAPIError = jest.fn();
    jest.resetAllMocks();
  });

  it("should return status not modified if there is no pending request", async () => {
    const { reportingManager, requestId } = mockRequestData.APPROVED;
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(null);
    const result = await requestService.approveRequest(
      reportingManager,
      requestId,
    );
    expect(result).toEqual(null);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });

  it("should approve user's pending request", async () => {
    const { reportingManager, requestId } = mockRequestData.PENDING;
    requestDbMock.approveRequest.mockResolvedValue(
      mockRequestData.APPROVED as any,
    );
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee as any);
    const result = await requestService.approveRequest(
      reportingManager,
      requestId,
    );
    expect(result).toEqual(HttpStatusResponse.OK);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
    expect(EmployeeService.prototype.getEmployee).toHaveBeenCalledWith(
      mockRequestData.PENDING.staffId,
    );
  });

  it("should return status not modified if employee not found", async () => {
    const { reportingManager, requestId } = mockRequestData.PENDING;
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    employeeServiceMock.getEmployee.mockResolvedValue(null);
    const result = await requestService.approveRequest(
      reportingManager,
      requestId,
    );
    expect(result).toEqual(null);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });

  it("should return null if performedBy is not authorized", async () => {
    const { reportingManager, requestId } = mockRequestData.PENDING;
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(
      mockRequestData.PENDING as any,
    );
    mockEmployee.reportingManager = null;
    employeeServiceMock.getEmployee.mockResolvedValue(mockEmployee);
    const result = await requestService.approveRequest(
      reportingManager,
      requestId,
    );
    expect(result).toEqual(null);
    expect(requestDbMock.getPendingRequestByRequestId).toHaveBeenCalledWith(
      requestId,
    );
  });
});

describe("getPendingRequestByRequestId", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue(null as never),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    mockMailer = {
      getInstance: jest.fn().mockReturnThis(),
      getTransporter: jest.fn().mockReturnValue(mockTransporter),
    } as unknown as jest.Mocked<Mailer>;

    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;

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

    notificationServiceMock = new NotificationService(
      employeeServiceMock,
      mockMailer,
    ) as jest.Mocked<NotificationService>;

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
    requestDbMock.getPendingRequestByRequestId = jest.fn();
    jest.resetAllMocks();
  });

  it("should return request for a valid requestId", async () => {
    const { requestId } = mockRequestData.PENDING;
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue([
      mockRequestData.PENDING,
    ] as any);
    const result = await requestService.getPendingRequestByRequestId(requestId);
    expect(result).toEqual([mockRequestData.PENDING] as any);
  });

  it("should return [] for an invalid staffId", async () => {
    requestDbMock.getPendingRequestByRequestId.mockResolvedValue(null);
    const result = await requestService.getPendingRequestByRequestId(1044);
    expect(result).toEqual(null);
  });
});

describe("setWithdrawnStatus", () => {
  let requestService: RequestService;
  let logServiceMock: any;
  let employeeServiceMock: any;
  let requestDbMock: any;
  let reassignmentServiceMock: any;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let mockMailer: jest.Mocked<Mailer>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    logServiceMock = {
      logRequestHelper: jest.fn(),
    };

    employeeServiceMock = {
      getEmployee: jest.fn(),
    };

    requestDbMock = {
      setWithdrawnStatus: jest.fn(),
    };

    reassignmentServiceMock = {
      getReassignmentActive: jest.fn(),
    };

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

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
  });

  it("should return null if the status update fails", async () => {
    const requestId = 1;

    requestDbMock.setWithdrawnStatus.mockResolvedValue(null);

    const result = await requestService.setWithdrawnStatus(requestId);

    expect(result).toBeNull();
  });

  it("should return OK on successful status update", async () => {
    const requestId = 2;

    requestDbMock.setWithdrawnStatus.mockResolvedValue(true);

    const result = await requestService.setWithdrawnStatus(requestId);

    expect(result).toBe(HttpStatusResponse.OK);
  });

  it("should call setWithdrawnStatus with the correct requestId", async () => {
    const requestId = 3;

    requestDbMock.setWithdrawnStatus.mockResolvedValue(true);

    await requestService.setWithdrawnStatus(requestId);

    expect(requestDbMock.setWithdrawnStatus).toHaveBeenCalledWith(requestId);
  });
});

describe("updateRequestStatusToExpired", () => {
  let requestService: RequestService;
  let logServiceMock: any;
  let employeeServiceMock: any;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let notificationServiceMock: jest.Mocked<NotificationService>;
  let requestDbMock: any;
  let reassignmentServiceMock: any;

  beforeEach(() => {
    requestDbMock = {
      updateRequestStatusToExpired: jest.fn(),
    };

    logServiceMock = {
      logRequestHelper: jest.fn(),
    };
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

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
  });

  it("should log the correct requests when there are requests to expire", async () => {
    const mockRequests = [{ requestId: 1 }, { requestId: 2 }];

    requestDbMock.updateRequestStatusToExpired.mockResolvedValue(mockRequests);

    await requestService.updateRequestStatusToExpired();

    expect(requestDbMock.updateRequestStatusToExpired).toHaveBeenCalled();
    expect(logServiceMock.logRequestHelper).toHaveBeenCalledTimes(2);

    expect(logServiceMock.logRequestHelper).toHaveBeenCalledWith({
      performedBy: PerformedBy.SYSTEM,
      requestId: 1,
      requestType: "REASSIGNMENT",
      action: Action.EXPIRE,
      dept: PerformedBy.PERFORMED_BY_SYSTEM,
      position: PerformedBy.PERFORMED_BY_SYSTEM,
    });

    expect(logServiceMock.logRequestHelper).toHaveBeenCalledWith({
      performedBy: PerformedBy.SYSTEM,
      requestId: 2,
      requestType: "REASSIGNMENT",
      action: Action.EXPIRE,
      dept: PerformedBy.PERFORMED_BY_SYSTEM,
      position: PerformedBy.PERFORMED_BY_SYSTEM,
    });
  });

  it("should not log anything when there are no requests", async () => {
    requestDbMock.updateRequestStatusToExpired.mockResolvedValue([]);

    await requestService.updateRequestStatusToExpired();

    expect(requestDbMock.updateRequestStatusToExpired).toHaveBeenCalled();
    expect(logServiceMock.logRequestHelper).not.toHaveBeenCalled();
  });
});

describe("revokeRequest", () => {
  let requestService: RequestService;
  let logServiceMock: any;
  let employeeServiceMock: any;
  let mockMailer: jest.Mocked<Mailer>;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;
  let notificationServiceMock: jest.Mocked<NotificationService>;
  let requestDbMock: any;
  let reassignmentServiceMock: any;

  beforeEach(() => {
    requestDbMock = {
      revokeRequest: jest.fn(),
    };

    employeeServiceMock = {
      getEmployee: jest.fn(),
    };

    reassignmentServiceMock = {
      getReassignmentActive: jest.fn(),
    };

    logServiceMock = {
      logRequestHelper: jest.fn(),
    };
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

    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    );
  });

  it("should return null if the request does not exist", async () => {
    const performedBy = 1;
    const requestId = 2;
    const reason = "No longer needed";

    requestService.getApprovedRequestByRequestId = jest
      .fn()
      .mockResolvedValue(null as never) as any;

    const result = await requestService.revokeRequest(
      performedBy,
      requestId,
      reason,
    );

    expect(result).toBeNull();
  });

  it("should return null if the user is not the reporting manager and no reassignment exists", async () => {
    const performedBy = 1;
    const requestId = 2;
    const reason = "No longer needed";
    const request = {
      reportingManager: 3,
      requestedDate: new Date(),
      managerName: "Manager Name",
    };

    requestService.getApprovedRequestByRequestId = jest
      .fn()
      .mockResolvedValue(request as never) as any;
    employeeServiceMock.getEmployee.mockResolvedValue({
      dept: "Sales",
      position: "Manager",
    });
    reassignmentServiceMock.getReassignmentActive.mockResolvedValue(null);

    const result = await requestService.revokeRequest(
      performedBy,
      requestId,
      reason,
    );

    expect(result).toBeNull();
  });

  it("should return null if the withdrawal date is past", async () => {
    const performedBy = 1;
    const requestId = 2;
    const reason = "No longer needed";
    const request = {
      reportingManager: 3,
      requestedDate: new Date(Date.now() - 100000000),
      managerName: "Manager Name",
    };

    requestService.getApprovedRequestByRequestId = jest
      .fn()
      .mockResolvedValue(request as never) as any;
    employeeServiceMock.getEmployee.mockResolvedValue({
      dept: "Sales",
      position: "Manager",
    });
    reassignmentServiceMock.getReassignmentActive.mockResolvedValue({
      tempManagerName: "Temp Manager",
    });

    const result = await requestService.revokeRequest(
      performedBy,
      requestId,
      reason,
    );

    expect(result).toBeNull();
  });
});
