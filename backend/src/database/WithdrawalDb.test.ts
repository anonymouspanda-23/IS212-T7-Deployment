import { HttpStatusResponse, Status } from "@/helpers";
import Withdrawal, { IWithdrawal } from "@/models/Withdrawal";
import WithdrawalDb from "./WithdrawalDb";

jest.mock("@/models/Withdrawal", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  updateMany: jest.fn(),
}));

describe("WithdrawalDb", () => {
  let withdrawalDb: WithdrawalDb;

  beforeEach(() => {
    withdrawalDb = new WithdrawalDb();
    jest.clearAllMocks();
  });

  describe("withdrawRequest", () => {
    it("should create a withdrawal request and return OK status", async () => {
      const document = {
        requestId: 1,
        staffId: 1,
        staffName: "John Doe",
        reportingManager: null,
        managerName: null,
        dept: "HR",
        position: "Manager",
        requestedDate: new Date(),
        requestType: "Annual Leave",
      };
      (Withdrawal.create as jest.Mock).mockResolvedValue(document);

      const result = await withdrawalDb.withdrawRequest(document);

      expect(Withdrawal.create).toHaveBeenCalledWith(document);
      expect(result).toBe(HttpStatusResponse.OK);
    });

    it("should return null if an error occurs during the creation", async () => {
      const document = {
        requestId: 1,
        staffId: 1,
        staffName: "John Doe",
        reportingManager: null,
        managerName: null,
        dept: "HR",
        position: "Manager",
        requestedDate: new Date(),
        requestType: "Annual Leave",
      };
      (Withdrawal.create as jest.Mock).mockRejectedValue(
        new Error("Error creating withdrawal"),
      );

      const result = await withdrawalDb.withdrawRequest(document);

      expect(Withdrawal.create).toHaveBeenCalledWith(document);
      expect(result).toBe(null);
    });
  });

  describe("getWithdrawalRequest", () => {
    it("should return withdrawal requests for the given requestId", async () => {
      const mockWithdrawalRequests: IWithdrawal[] = [
        {
          withdrawalId: 1,
          requestId: 1,
          staffId: 1,
          staffName: "John Doe",
          reportingManager: null,
          managerName: null,
          dept: "HR",
          position: "Manager",
          requestedDate: new Date(),
          requestType: "Annual Leave",
          status: Status.PENDING,
          reason: null,
        },
      ];
      (Withdrawal.find as jest.Mock).mockResolvedValue(mockWithdrawalRequests);

      const result = await withdrawalDb.getWithdrawalRequest(1);

      expect(Withdrawal.find).toHaveBeenCalledWith({ requestId: 1 });
      expect(result).toEqual(mockWithdrawalRequests);
    });
  });

  describe("getSubordinatesWithdrawalRequests", () => {
    it("should return withdrawal requests for the given reportingManager", async () => {
      const mockWithdrawalRequests: IWithdrawal[] = [
        {
          withdrawalId: 2,
          requestId: 2,
          staffId: 2,
          staffName: "Jane Doe",
          reportingManager: 1,
          managerName: "Manager A",
          dept: "HR",
          position: "Manager",
          requestedDate: new Date(),
          requestType: "Sick Leave",
          status: Status.PENDING,
          reason: null,
        },
      ];
      (Withdrawal.find as jest.Mock).mockResolvedValue(mockWithdrawalRequests);

      const result = await withdrawalDb.getSubordinatesWithdrawalRequests(1);

      expect(Withdrawal.find).toHaveBeenCalledWith({ reportingManager: 1 });
      expect(result).toEqual(mockWithdrawalRequests);
    });
  });

  describe("getOwnWithdrawalRequests", () => {
    it("should return withdrawal requests for the given staffId", async () => {
      const mockWithdrawalRequests: IWithdrawal[] = [
        {
          withdrawalId: 3,
          requestId: 3,
          staffId: 1,
          staffName: "John Doe",
          reportingManager: null,
          managerName: null,
          dept: "HR",
          position: "Manager",
          requestedDate: new Date(),
          requestType: "Annual Leave",
          status: Status.PENDING,
          reason: null,
        },
      ];
      (Withdrawal.find as jest.Mock).mockResolvedValue(mockWithdrawalRequests);

      const result = await withdrawalDb.getOwnWithdrawalRequests(1);

      expect(Withdrawal.find).toHaveBeenCalledWith({ staffId: 1 });
      expect(result).toEqual(mockWithdrawalRequests);
    });
  });

  describe("getWithdrawalRequestById", () => {
    it("should return a withdrawal request for the given withdrawalId", async () => {
      const mockWithdrawalRequest: IWithdrawal = {
        withdrawalId: 1,
        requestId: 1,
        staffId: 1,
        staffName: "John Doe",
        reportingManager: null,
        managerName: null,
        dept: "HR",
        position: "Manager",
        requestedDate: new Date(),
        requestType: "Annual Leave",
        status: Status.PENDING,
        reason: null,
      };
      (Withdrawal.findOne as jest.Mock).mockResolvedValue(
        mockWithdrawalRequest,
      );

      const result = await withdrawalDb.getWithdrawalRequestById(1);

      expect(Withdrawal.findOne).toHaveBeenCalledWith({ withdrawalId: 1 });
      expect(result).toEqual(mockWithdrawalRequest);
    });

    it("should return null if no withdrawal request is found", async () => {
      (Withdrawal.findOne as jest.Mock).mockResolvedValue(null);

      const result = await withdrawalDb.getWithdrawalRequestById(999);

      expect(Withdrawal.findOne).toHaveBeenCalledWith({ withdrawalId: 999 });
      expect(result).toBeNull();
    });
  });

  describe("approveWithdrawalRequest", () => {
    it("should approve a withdrawal request and return OK status", async () => {
      (Withdrawal.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });

      const result = await withdrawalDb.approveWithdrawalRequest(1);

      expect(Withdrawal.updateMany).toHaveBeenCalledWith(
        { withdrawalId: 1, status: Status.PENDING },
        { $set: { status: Status.APPROVED } },
      );
      expect(result).toBe(HttpStatusResponse.OK);
    });

    it("should return null if no withdrawal requests were modified", async () => {
      (Withdrawal.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 0,
      });

      const result = await withdrawalDb.approveWithdrawalRequest(1);

      expect(Withdrawal.updateMany).toHaveBeenCalledWith(
        { withdrawalId: 1, status: Status.PENDING },
        { $set: { status: Status.APPROVED } },
      );
      expect(result).toBeNull();
    });
  });

  describe("rejectWithdrawalRequest", () => {
    it("should reject a withdrawal request and return OK status", async () => {
      const reason = "Insufficient funds";
      (Withdrawal.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 1,
      });

      const result = await withdrawalDb.rejectWithdrawalRequest(1, reason);

      expect(Withdrawal.updateMany).toHaveBeenCalledWith(
        { withdrawalId: 1, status: Status.PENDING },
        { $set: { status: Status.REJECTED, reason: reason } },
      );
      expect(result).toBe(HttpStatusResponse.OK);
    });

    it("should return null if no withdrawal requests were modified", async () => {
      (Withdrawal.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 0,
      });

      const result = await withdrawalDb.rejectWithdrawalRequest(
        1,
        "Insufficient funds",
      );

      expect(Withdrawal.updateMany).toHaveBeenCalledWith(
        { withdrawalId: 1, status: Status.PENDING },
        { $set: { status: Status.REJECTED, reason: "Insufficient funds" } },
      );
      expect(result).toBeNull();
    });
  });
});
