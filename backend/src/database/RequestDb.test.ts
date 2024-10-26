import RequestDb from "@/database/RequestDb";
import { HttpStatusResponse, RequestType, Status } from "@/helpers";
import Request from "@/models/Request";

jest.mock("@/models/Request", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
  create: jest.fn(),
  aggregate: jest.fn(),
}));

const requestDb = new RequestDb();

describe("RequestDb", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get my schedule", async () => {
    const mockSchedule = [{ staffId: 1, requestId: 1 }];
    (Request.find as jest.Mock).mockResolvedValue(mockSchedule);
    const result = await requestDb.getMySchedule(1);
    expect(result).toEqual(mockSchedule);
    expect(Request.find).toHaveBeenCalledWith(
      { staffId: 1 },
      "-_id -updatedAt",
    );
  });

  it("should get all subordinates requests", async () => {
    const mockSubordinatesRequests = [{ staffId: 1, requestId: 1 }];
    (Request.find as jest.Mock).mockResolvedValue(mockSubordinatesRequests);
    const result = await requestDb.getAllSubordinatesRequests(1);
    expect(result).toEqual(mockSubordinatesRequests);
    expect(Request.find).toHaveBeenCalledWith({ reportingManager: 1 });
  });

  it("should get own pending requests", async () => {
    const mockPendingRequests = [
      { staffId: 1, requestId: 1, status: Status.PENDING },
    ];
    (Request.find as jest.Mock).mockResolvedValue(mockPendingRequests);
    const result = await requestDb.getOwnPendingRequests(1);
    expect(result).toEqual(mockPendingRequests);
    expect(Request.find).toHaveBeenCalledWith({
      staffId: 1,
      status: Status.PENDING,
    });
  });

  it("should update request initiated withdrawal value", async () => {
    (Request.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    const result = await requestDb.updateRequestinitiatedWithdrawalValue(1);
    expect(result).toBe(true);
    expect(Request.updateOne).toHaveBeenCalledWith(
      { requestId: 1, initiatedWithdrawal: false },
      { $set: { initiatedWithdrawal: true } },
    );
  });

  it("should cancel pending requests", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    const result = await requestDb.cancelPendingRequests(1, 1);
    expect(result).toBe(HttpStatusResponse.OK);
    expect(Request.updateMany).toHaveBeenCalledWith(
      { staffId: 1, requestId: 1, status: Status.PENDING },
      { $set: { status: Status.CANCELLED } },
    );
  });

  it("should return null if no pending requests to cancel", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
    const result = await requestDb.cancelPendingRequests(1, 1);
    expect(result).toBeNull();
  });

  it("should get pending or approved requests", async () => {
    const mockRequests = [
      { staffId: 1, requestId: 1, status: Status.APPROVED },
    ];
    (Request.find as jest.Mock).mockResolvedValue(mockRequests);
    const result = await requestDb.getPendingOrApprovedRequests(1);
    expect(result).toEqual(mockRequests);
    expect(Request.find).toHaveBeenCalledWith({
      staffId: 1,
      status: {
        $nin: [
          Status.CANCELLED,
          Status.WITHDRAWN,
          Status.REJECTED,
          Status.EXPIRED,
          Status.REVOKED,
        ],
      },
    });
  });

  it("should get team schedule", async () => {
    const mockTeamSchedule = [{ staffId: 1, requestId: 1 }];
    (Request.find as jest.Mock).mockResolvedValue(mockTeamSchedule);
    const result = await requestDb.getTeamSchedule(1, "Manager");
    expect(result).toEqual(mockTeamSchedule);
    expect(Request.find).toHaveBeenCalledWith(
      { reportingManager: 1, position: "Manager", status: Status.APPROVED },
      "-_id -createdAt -updatedAt",
    );
  });

  it("should get all department schedule", async () => {
    const mockDeptSchedule = [
      { dept: "HR", requests: [{ staffId: 1, requestId: 1 }] },
    ];
    (Request.aggregate as jest.Mock).mockResolvedValue(mockDeptSchedule);
    const result = await requestDb.getAllDeptSchedule();
    expect(result).toEqual({ HR: [{ staffId: 1, requestId: 1 }] });
    expect(Request.aggregate).toHaveBeenCalledWith([
      { $match: { status: Status.APPROVED } },
      {
        $project: {
          _id: 0,
          staffId: 1,
          staffName: 1,
          reportingManager: 1,
          managerName: 1,
          dept: 1,
          requestedDate: 1,
          requestType: 1,
          position: 1,
          reason: 1,
          status: 1,
          requestId: 1,
        },
      },
      { $group: { _id: "$dept", requests: { $push: "$$ROOT" } } },
      { $project: { _id: 0, dept: "$_id", requests: 1 } },
    ]);
  });

  it("should post a request", async () => {
    const mockDocument = {
      staffId: 1,
      staffName: "John Doe",
      reportingManager: 2,
      managerName: "Jane Doe",
      dept: "HR",
      requestedDate: new Date(),
      requestType: RequestType.FULL,
      reason: "Sick",
      position: "Manager",
    };
    (Request.create as jest.Mock).mockResolvedValue({ requestId: 1 });
    const result = await requestDb.postRequest(mockDocument);
    expect(result).toBe(1);
    expect(Request.create).toHaveBeenCalledWith(mockDocument);
  });

  it("should return false on post request error", async () => {
    const mockDocument = {
      staffId: 1,
      staffName: "John Doe",
      reportingManager: 2,
      managerName: "Jane Doe",
      dept: "HR",
      requestedDate: new Date(),
      requestType: RequestType.FULL,
      reason: "Sick",
      position: "Manager",
    };
    (Request.create as jest.Mock).mockRejectedValue(new Error("Error"));
    const result = await requestDb.postRequest(mockDocument);
    expect(result).toBe(false);
  });

  it("should approve request", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    const result = await requestDb.approveRequest(1);
    expect(result).toBe(HttpStatusResponse.OK);
    expect(Request.updateMany).toHaveBeenCalledWith(
      { requestId: 1, status: Status.PENDING },
      { $set: { status: Status.APPROVED } },
    );
  });

  it("should return null if no request was approved", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
    const result = await requestDb.approveRequest(1);
    expect(result).toBeNull();
  });

  it("should get pending request by requestId", async () => {
    const mockRequest = { requestId: 1, status: Status.PENDING };
    (Request.findOne as jest.Mock).mockResolvedValue(mockRequest);
    const result = await requestDb.getPendingRequestByRequestId(1);
    expect(result).toEqual(mockRequest);
    expect(Request.findOne).toHaveBeenCalledWith(
      { requestId: 1, status: Status.PENDING },
      "-_id -createdAt -updatedAt",
    );
  });

  it("should reject request", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    const result = await requestDb.rejectRequest(1, "No longer needed");
    expect(result).toBe(HttpStatusResponse.OK);
    expect(Request.updateMany).toHaveBeenCalledWith(
      { requestId: 1, status: Status.PENDING },
      { $set: { status: Status.REJECTED, reason: "No longer needed" } },
    );
  });

  it("should return null if no request was rejected", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
    const result = await requestDb.rejectRequest(1, "No longer needed");
    expect(result).toBeNull();
  });

  it("should get approved request by requestId", async () => {
    const mockRequest = { requestId: 1, status: Status.APPROVED };
    (Request.findOne as jest.Mock).mockResolvedValue(mockRequest);
    const result = await requestDb.getApprovedRequestByRequestId(1);
    expect(result).toEqual(mockRequest);
    expect(Request.findOne).toHaveBeenCalledWith(
      { requestId: 1, status: Status.APPROVED },
      "-_id -createdAt -updatedAt",
    );
  });

  it("should revoke request", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    const result = await requestDb.revokeRequest(1, "Changed my mind");
    expect(result).toBe(HttpStatusResponse.OK);
    expect(Request.updateMany).toHaveBeenCalledWith(
      { requestId: 1, status: Status.APPROVED },
      { $set: { status: Status.REVOKED, reason: "Changed my mind" } },
    );
  });

  it("should return null if no request was revoked", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
    const result = await requestDb.revokeRequest(1, "Changed my mind");
    expect(result).toBeNull();
  });

  it("should set withdrawn status", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    const result = await requestDb.setWithdrawnStatus(1);
    expect(result).toBe(HttpStatusResponse.OK);
    expect(Request.updateMany).toHaveBeenCalledWith(
      { requestId: 1, status: Status.APPROVED },
      { $set: { status: Status.WITHDRAWN } },
    );
  });

  it("should return null if no request was set to withdrawn", async () => {
    (Request.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });
    const result = await requestDb.setWithdrawnStatus(1);
    expect(result).toBeNull();
  });
});
