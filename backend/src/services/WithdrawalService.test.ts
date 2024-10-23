import EmployeeDb from "@/database/EmployeeDb";
import LogDb from "@/database/LogDb";
import RequestDb from "@/database/RequestDb";
import RequestService from "@/services/RequestService";
import { mockWithdrawalData, mockRequestData } from "@/tests/mockData";
import { jest } from "@jest/globals";
import EmployeeService from "./EmployeeService";
import LogService from "./LogService";
import ReassignmentDb from "@/database/ReassignmentDb";
import ReassignmentService from "@/services/ReassignmentService";
import WithdrawalService from "@/services/WithdrawalService";
import WithdrawalDb from "@/database/WithdrawalDb";
import { HttpStatusResponse } from "@/helpers";

describe("getWithdrawalRequest", () => {
  let requestService: RequestService;
  let requestDbMock: jest.Mocked<RequestDb>;
  let employeeDbMock: EmployeeDb;
  let employeeServiceMock: jest.Mocked<EmployeeService>;
  let logDbMock: jest.Mocked<LogDb>;
  let logServiceMock: jest.Mocked<LogService>;
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
    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
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
    requestService = new RequestService(
      logServiceMock,
      employeeServiceMock,
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
