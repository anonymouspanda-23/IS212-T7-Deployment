import RequestController from "@/controllers/RequestController";
import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import ReassignmentDb from "@/database/ReassignmentDb";
import RequestDb from "@/database/RequestDb";
import {
  errMsg,
  HttpStatusResponse,
  noteMsg,
  Status,
  successMsg,
} from "@/helpers";
import {
  approvalSchema,
  rejectionSchema,
  revocationSchema,
  staffIdSchema,
} from "@/schema";
import EmployeeService from "@/services/EmployeeService";
import LogService from "@/services/LogService";
import ReassignmentService from "@/services/ReassignmentService";
import RequestService from "@/services/RequestService";
import { Context } from "koa";
import Mailer from "@/config/mailer";
import { jest } from "@jest/globals";
import UtilsController from "./UtilsController";
import NotificationService from "@/services/NotificationService";

describe("RequestController", () => {
  let requestController: RequestController;
  let requestServiceMock: jest.Mocked<RequestService>;
  let requestDbMock: RequestDb;
  let employeeDbMock: EmployeeDb;
  let reassignmentDbMock: ReassignmentDb;
  let reassignmentServiceMock: jest.Mocked<ReassignmentService>;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let mockMailer: jest.Mocked<Mailer>;
  let ctx: Context;
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

  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
  let notificationServiceMock: jest.Mocked<NotificationService>;

  beforeEach(() => {
    requestDbMock = new RequestDb() as jest.Mocked<RequestDb>;
    employeeDbMock = new EmployeeDb() as jest.Mocked<EmployeeDb>;
    reassignmentDbMock = new ReassignmentDb() as jest.Mocked<ReassignmentDb>;
    employeeServiceMock = new EmployeeService(
      employeeDbMock,
    ) as jest.Mocked<EmployeeService>;
    mockMailer = Mailer.getInstance() as jest.Mocked<Mailer>;
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
    ) as jest.Mocked<ReassignmentService>;

    notificationServiceMock = new NotificationService(
      employeeServiceMock,
      mockMailer
    ) as jest.Mocked<NotificationService>;

    requestServiceMock = new RequestService(
      logServiceMock,
      employeeServiceMock,
      notificationServiceMock,
      requestDbMock,
      reassignmentServiceMock,
    ) as jest.Mocked<RequestService>;
    requestController = new RequestController(requestServiceMock);
    ctx = {
      method: "POST",
      query: {},
      body: {},
      request: { body: {} },
      response: {},
    } as Context;
    requestServiceMock.postRequest = jest.fn();
    jest.resetAllMocks();
  });

  it("should return an error when missing parameters", async () => {
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual({
      errMsg: {
        _errors: [],
        staffId: {
          _errors: ["Required"],
        },
        requestedDates: {
          _errors: ["Required"],
        },
        reason: {
          _errors: ["Required"],
        },
      },
    });
  });

  it("should return a (success{message, dates}, error, note) object when a valid date is inputted", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [
        ["2024-09-19", "FULL"],
        ["2024-09-20", "FULL"],
      ],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [
        ["2024-09-19", "FULL"],
        ["2024-09-20", "FULL"],
      ],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };

    const expectedResponse = {
      success: {
        message: successMsg,
        dates: [
          ["2024-09-19", "FULL"],
          ["2024-09-20", "FULL"],
        ],
      },
      error: [],
      note: {
        message: "",
        dates: [],
      },
    };

    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success{message, dates}, error, note{message, dates}) object when a valid date is inputted", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [
        ["2024-09-19", "FULL"],
        ["2024-09-20", "FULL"],
      ],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [
        ["2024-09-19", "FULL"],
        ["2024-09-20", "FULL"],
      ],
      noteDates: [["2024-09-20", "FULL"]],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };

    const expectedResponse = {
      success: {
        message: successMsg,
        dates: [
          ["2024-09-19", "FULL"],
          ["2024-09-20", "FULL"],
        ],
      },
      error: [],
      note: {
        message: noteMsg,
        dates: [["2024-09-20", "FULL"]],
      },
    };

    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success{message, dates}, error[duplicate], note) object when a duplicated date is inputted", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [
        ["2024-09-20", "FULL"],
        ["2024-09-20", "FULL"],
      ],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [["2024-09-20", "FULL"]],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [["2024-09-20", "FULL"]],
      insertErrorDates: [],
    };

    const expectedResponse = {
      success: {
        message: successMsg,
        dates: [["2024-09-20", "FULL"]],
      },
      error: [
        {
          message: errMsg.DUPLICATE_DATE,
          dates: [["2024-09-20", "FULL"]],
        },
      ],
      note: {
        message: "",
        dates: [],
      },
    };

    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success, error[weekend], note) object when a weekend is inputted", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [["2024-09-21", "FULL"]],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [["2024-09-21", "FULL"]],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };

    const expectedResponse = {
      success: {
        message: "",
        dates: [],
      },
      error: [
        {
          message: errMsg.WEEKEND_REQUEST,
          dates: [["2024-09-21", "FULL"]],
        },
      ],
      note: {
        message: "",
        dates: [],
      },
    };

    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success, error[pastDate], note) object when a past date is inputted", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [["2024-08-21", "FULL"]],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [["2024-08-21", "FULL"]],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };

    const expectedResponse = {
      success: {
        message: "",
        dates: [],
      },
      error: [
        {
          message: errMsg.PAST_DATE,
          dates: [["2024-08-21", "FULL"]],
        },
      ],
      note: {
        message: "",
        dates: [],
      },
    };

    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success, error[pastDeadline], note) object when a date that is past application deadline is inputted", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [["2024-09-21", "FULL"]],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [["2024-08-21", "FULL"]],
      duplicateDates: [],
      insertErrorDates: [],
    };

    const expectedResponse = {
      success: {
        message: "",
        dates: [],
      },
      error: [
        {
          message: errMsg.PAST_DEADLINE,
          dates: [["2024-08-21", "FULL"]],
        },
      ],
      note: {
        message: "",
        dates: [],
      },
    };
    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success, error[insertError], note) object when a there is a DB insert error", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [["2024-09-21", "FULL"]],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [["2024-09-21", "FULL"]],
    };

    const expectedResponse = {
      success: {
        message: "",
        dates: [],
      },
      error: [
        {
          message: errMsg.INSERT_ERROR,
          dates: [["2024-09-21", "FULL"]],
        },
      ],
      note: {
        message: "",
        dates: [],
      },
    };

    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success, error[insertError, pastDate], note) object when a there is a DB insert error and a past date is inputted", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [
        ["2024-09-21", "FULL"],
        ["2023-09-21", "FULL"],
      ],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [],
      weekendDates: [],
      pastDates: [["2023-09-21", "FULL"]],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [["2024-09-21", "FULL"]],
    };

    const expectedResponse = {
      success: {
        message: "",
        dates: [],
      },
      error: [
        {
          message: errMsg.PAST_DATE,
          dates: [["2023-09-21", "FULL"]],
        },
        {
          message: errMsg.INSERT_ERROR,
          dates: [["2024-09-21", "FULL"]],
        },
      ],
      note: {
        message: "",
        dates: [],
      },
    };

    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });

  it("should return a (success, error[sameDayRequest], note) object when a there is an existing request for the inputted date", async () => {
    ctx.request.body = {
      staffId: 3,
      staffName: "Amy Cheong",
      reportingManager: 1,
      managerName: "John Doe",
      dept: "IT",
      requestedDates: [["2024-09-21", "FULL"]],
      reason: "Take care of mother",
    };

    const expectedServiceResponse: ResponseDates = {
      successDates: [],
      noteDates: [],
      errorDates: [["2023-09-21", "FULL"]],
      weekendDates: [],
      pastDates: [],
      pastDeadlineDates: [],
      duplicateDates: [],
      insertErrorDates: [],
    };

    const expectedResponse = {
      success: {
        message: "",
        dates: [],
      },
      error: [
        {
          message: errMsg.SAME_DAY_REQUEST,
          dates: [["2023-09-21", "FULL"]],
        },
      ],
      note: {
        message: "",
        dates: [],
      },
    };
    requestServiceMock.postRequest.mockResolvedValue(expectedServiceResponse);
    await requestController.postRequest(ctx);
    expect(ctx.body).toEqual(expectedResponse);
    expect(requestServiceMock.postRequest).toHaveBeenCalledWith(
      ctx.request.body,
    );
  });
});

describe("cancelPendingRequests", () => {
  let requestController: RequestController;
  let mockRequestService: { cancelPendingRequests: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      cancelPendingRequests: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      request: {
        body: {
          staffId: "1",
          requestId: "2",
        },
      },
      body: {},
    } as unknown as Context;
  });

  it("should return OK if the request is successfully cancelled", async () => {
    mockRequestService.cancelPendingRequests.mockResolvedValue(
      HttpStatusResponse.OK as never,
    );

    await requestController.cancelPendingRequests(ctx);

    expect(ctx.body).toBe(HttpStatusResponse.OK);
    expect(mockRequestService.cancelPendingRequests).toHaveBeenCalledWith(1, 2);
  });

  it("should return NOT_MODIFIED if the request was not modified", async () => {
    mockRequestService.cancelPendingRequests.mockResolvedValue(
      HttpStatusResponse.NOT_MODIFIED as never,
    );

    await requestController.cancelPendingRequests(ctx);

    expect(ctx.body).toBe(HttpStatusResponse.NOT_MODIFIED);
    expect(mockRequestService.cancelPendingRequests).toHaveBeenCalledWith(1, 2);
  });
});

describe("getAllSubordinatesRequests", () => {
  let requestController: RequestController;
  let mockRequestService: { getAllSubordinatesRequests: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      getAllSubordinatesRequests: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      request: {
        header: {
          id: "1",
        },
      },
      body: {},
    } as unknown as Context;
  });

  it("should return subordinates requests", async () => {
    const mockRequests = [
      { requestId: 1, status: Status.PENDING },
      { requestId: 2, status: Status.APPROVED },
    ];
    mockRequestService.getAllSubordinatesRequests.mockResolvedValue(
      mockRequests as never,
    );

    await requestController.getAllSubordinatesRequests(ctx);

    expect(ctx.body).toEqual(mockRequests);
    expect(mockRequestService.getAllSubordinatesRequests).toHaveBeenCalledWith(
      1,
    );
  });

  it("should handle cases where no requests are found", async () => {
    mockRequestService.getAllSubordinatesRequests.mockResolvedValue([] as never);

    await requestController.getAllSubordinatesRequests(ctx);

    expect(ctx.body).toEqual([]);
    expect(mockRequestService.getAllSubordinatesRequests).toHaveBeenCalledWith(
      1,
    );
  });

  it("should handle errors gracefully", async () => {
    const errorMessage = "Service error";
    mockRequestService.getAllSubordinatesRequests.mockRejectedValue(
      new Error(errorMessage) as never,
    );

    await expect(
      requestController.getAllSubordinatesRequests(ctx),
    ).rejects.toThrow(errorMessage);
  });
});

describe("getOwnPendingRequests", () => {
  let requestController: RequestController;
  let mockRequestService: { getOwnPendingRequests: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      getOwnPendingRequests: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      query: {
        myId: "1",
      },
      body: {},
    } as unknown as Context;
  });

  it("should return pending requests for the given myId", async () => {
    const mockPendingRequests = [
      { requestId: 1, status: "pending" },
      { requestId: 2, status: "pending" },
    ];
    mockRequestService.getOwnPendingRequests.mockResolvedValue(
      mockPendingRequests as never,
    );

    await requestController.getOwnPendingRequests(ctx);

    expect(ctx.body).toEqual(mockPendingRequests);
    expect(mockRequestService.getOwnPendingRequests).toHaveBeenCalledWith(1);
  });

  it("should handle cases where no pending requests are found", async () => {
    mockRequestService.getOwnPendingRequests.mockResolvedValue([] as never);

    await requestController.getOwnPendingRequests(ctx);

    expect(ctx.body).toEqual([]);
    expect(mockRequestService.getOwnPendingRequests).toHaveBeenCalledWith(1);
  });

  it("should throw an error if myId is missing", async () => {
    ctx.query.myId = undefined;

    const throwAPIErrorSpy = jest
      .spyOn(UtilsController, "throwAPIError")
      .mockImplementation(() => {});

    await requestController.getOwnPendingRequests(ctx);

    expect(throwAPIErrorSpy).toHaveBeenCalledWith(
      ctx,
      errMsg.MISSING_PARAMETERS,
    );
    expect(ctx.body).toEqual({});
  });

  it("should handle errors from the service gracefully", async () => {
    const errorMessage = "Service error";
    mockRequestService.getOwnPendingRequests.mockRejectedValue(
      new Error(errorMessage) as never,
    );

    await expect(requestController.getOwnPendingRequests(ctx)).rejects.toThrow(
      errorMessage,
    );
  });
});

describe("getMySchedule", () => {
  let requestController: RequestController;
  let mockRequestService: { getMySchedule: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      getMySchedule: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      query: {
        myId: "1",
      },
      body: {},
    } as unknown as Context;
  });

  it("should return schedule for the given myId", async () => {
    const mockSchedule = [{ date: "2024-10-20", event: "Meeting" }];
    mockRequestService.getMySchedule.mockResolvedValue(mockSchedule as never);

    await requestController.getMySchedule(ctx);

    expect(ctx.body).toEqual(mockSchedule);
    expect(mockRequestService.getMySchedule).toHaveBeenCalledWith(1);
  });

  it("should handle cases where no schedule is found", async () => {
    mockRequestService.getMySchedule.mockResolvedValue([] as never);

    await requestController.getMySchedule(ctx);

    expect(ctx.body).toEqual([]);
    expect(mockRequestService.getMySchedule).toHaveBeenCalledWith(1);
  });

  it("should throw an error if myId is missing", async () => {
    ctx.query.myId = undefined;

    const throwAPIErrorSpy = jest
      .spyOn(UtilsController, "throwAPIError")
      .mockImplementation(() => {});

    await requestController.getMySchedule(ctx);

    expect(throwAPIErrorSpy).toHaveBeenCalledWith(
      ctx,
      errMsg.MISSING_PARAMETERS,
    );
    expect(ctx.body).toEqual({});
  });

  it("should handle errors from the service gracefully", async () => {
    const errorMessage = "Service error";
    mockRequestService.getMySchedule.mockRejectedValue(new Error(errorMessage) as never);

    await expect(requestController.getMySchedule(ctx)).rejects.toThrow(
      errorMessage,
    );
  });
});

describe("getSchedule", () => {
  let requestController: RequestController;
  let mockRequestService: { getSchedule: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      getSchedule: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      request: {
        header: {
          id: "1",
        },
      },
      body: {},
    } as unknown as Context;
  });

  it("should return schedule for the given id", async () => {
    const mockSchedule = [{ date: "2024-10-20", event: "Meeting" }];
    mockRequestService.getSchedule.mockResolvedValue(mockSchedule as never);

    await requestController.getSchedule(ctx);

    expect(ctx.body).toEqual(mockSchedule);
    expect(mockRequestService.getSchedule).toHaveBeenCalledWith(1);
  });

  it("should handle cases where no schedule is found", async () => {
    mockRequestService.getSchedule.mockResolvedValue([] as never);

    await requestController.getSchedule(ctx);

    expect(ctx.body).toEqual([]);
    expect(mockRequestService.getSchedule).toHaveBeenCalledWith(1);
  });

  it("should return error message when validation fails", async () => {
    ctx.request.header.id = "invalid-id"; // Set an invalid id

    staffIdSchema.safeParse = jest.fn().mockReturnValue({
      success: false,
      error: {
        format: jest.fn().mockReturnValue("Invalid Id format"),
      },
    }) as any;

    await requestController.getSchedule(ctx);

    expect(ctx.body).toEqual({
      errMsg: "Invalid Id format",
    });
  });
});

describe("approveRequest", () => {
  let requestController: RequestController;
  let mockRequestService: { approveRequest: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      approveRequest: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      request: {
        body: {},
      },
      body: {},
    } as unknown as Context;
  });

  it("should return error message when validation fails", async () => {
    ctx.request.body = { invalidField: "data" };

    approvalSchema.safeParse = jest.fn().mockReturnValue({
      success: false,
      error: {
        format: jest.fn().mockReturnValue("Invalid approval details"),
      },
    }) as any;

    await requestController.approveRequest(ctx);

    expect(ctx.body).toEqual({
      errMsg: "Invalid approval details",
    });
  });

  it("should call approveRequest with valid details", async () => {
    ctx.request.body = {
      performedBy: "1",
      requestId: "2",
    };

    approvalSchema.safeParse = jest.fn().mockReturnValue({
      success: true,
    }) as any;

    mockRequestService.approveRequest.mockResolvedValue(HttpStatusResponse.OK as never);

    await requestController.approveRequest(ctx);

    expect(mockRequestService.approveRequest).toHaveBeenCalledWith(1, 2);
    expect(ctx.body).toEqual(HttpStatusResponse.OK);
  });

  it("should return NOT_MODIFIED if approveRequest result is not OK", async () => {
    ctx.request.body = {
      performedBy: "1",
      requestId: "2",
    };

    approvalSchema.safeParse = jest.fn().mockReturnValue({
      success: true,
    }) as any;

    mockRequestService.approveRequest.mockResolvedValue(
      HttpStatusResponse.NOT_MODIFIED as never,
    );

    await requestController.approveRequest(ctx);

    expect(mockRequestService.approveRequest).toHaveBeenCalledWith(1, 2);
    expect(ctx.body).toEqual(HttpStatusResponse.NOT_MODIFIED);
  });
});

describe("rejectRequest", () => {
  let requestController: RequestController;
  let mockRequestService: { rejectRequest: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      rejectRequest: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      request: {
        body: {},
      },
      body: {},
    } as unknown as Context;
  });

  it("should return error message when validation fails", async () => {
    ctx.request.body = { invalidField: "data" };

    rejectionSchema.safeParse = jest.fn().mockReturnValue({
      success: false,
      error: {
        format: jest.fn().mockReturnValue("Invalid rejection details"),
      },
    }) as any;

    await requestController.rejectRequest(ctx);

    expect(ctx.body).toEqual({
      errMsg: "Invalid rejection details",
    });
  });

  it("should call rejectRequest with valid details", async () => {
    ctx.request.body = {
      performedBy: "1",
      requestId: "2",
      reason: "Not needed anymore",
    };

    rejectionSchema.safeParse = jest.fn().mockReturnValue({
      success: true,
    }) as any;

    mockRequestService.rejectRequest.mockResolvedValue(HttpStatusResponse.OK as never);

    await requestController.rejectRequest(ctx);

    expect(mockRequestService.rejectRequest).toHaveBeenCalledWith(
      1,
      2,
      "Not needed anymore",
    );
    expect(ctx.body).toEqual(HttpStatusResponse.OK);
  });

  it("should return NOT_MODIFIED if rejectRequest result is not OK", async () => {
    ctx.request.body = {
      performedBy: "1",
      requestId: "2",
      reason: "Not needed anymore",
    };

    rejectionSchema.safeParse = jest.fn().mockReturnValue({
      success: true,
    }) as any;

    mockRequestService.rejectRequest.mockResolvedValue(
      HttpStatusResponse.NOT_MODIFIED as never,
    );

    await requestController.rejectRequest(ctx);

    expect(mockRequestService.rejectRequest).toHaveBeenCalledWith(
      1,
      2,
      "Not needed anymore",
    );
    expect(ctx.body).toEqual(HttpStatusResponse.NOT_MODIFIED);
  });
});

describe("revokeRequest", () => {
  let requestController: RequestController;
  let mockRequestService: { revokeRequest: jest.Mock };
  let ctx: Context;

  beforeEach(() => {
    mockRequestService = {
      revokeRequest: jest.fn(),
    };

    requestController = new RequestController(mockRequestService as any);

    ctx = {
      request: {
        body: {},
      },
      body: {},
    } as unknown as Context;
  });

  it("should return error message when validation fails", async () => {
    ctx.request.body = { invalidField: "data" };

    revocationSchema.safeParse = jest.fn().mockReturnValue({
      success: false,
      error: {
        format: jest.fn().mockReturnValue("Invalid revocation details"),
      },
    }) as any;

    await requestController.revokeRequest(ctx);

    expect(ctx.body).toEqual({
      errMsg: "Invalid revocation details",
    });
  });

  it("should call revokeRequest with valid details", async () => {
    ctx.request.body = {
      performedBy: "1",
      requestId: "2",
      reason: "Revoking for testing",
    };

    revocationSchema.safeParse = jest.fn().mockReturnValue({
      success: true,
    }) as any;

    mockRequestService.revokeRequest.mockResolvedValue(HttpStatusResponse.OK as never);

    await requestController.revokeRequest(ctx);

    expect(mockRequestService.revokeRequest).toHaveBeenCalledWith(
      1,
      2,
      "Revoking for testing",
    );
    expect(ctx.body).toEqual(HttpStatusResponse.OK);
  });

  it("should return NOT_MODIFIED if revokeRequest result is not OK", async () => {
    ctx.request.body = {
      performedBy: "1",
      requestId: "2",
      reason: "Revoking for testing",
    };

    revocationSchema.safeParse = jest.fn().mockReturnValue({
      success: true,
    }) as any;

    mockRequestService.revokeRequest.mockResolvedValue(
      HttpStatusResponse.NOT_MODIFIED as never,
    );

    await requestController.revokeRequest(ctx);

    expect(mockRequestService.revokeRequest).toHaveBeenCalledWith(
      1,
      2,
      "Revoking for testing",
    );
    expect(ctx.body).toEqual(HttpStatusResponse.NOT_MODIFIED);
  });
});
