import { Status } from "@/helpers";
import Reassignment from "@/models/Reassignment";
import ReassignmentDb from "./ReassignmentDb";

jest.mock("@/models/Reassignment", () => ({
  updateMany: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  exists: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

describe("ReassignmentDb", () => {
  let reassignmentDb: ReassignmentDb;

  beforeEach(() => {
    reassignmentDb = new ReassignmentDb();
    jest.clearAllMocks();
  });

  describe("insertReassignmentRequest", () => {
    it("should insert a new reassignment request", async () => {
      const reassignmentRequest = {
        staffId: 1,
        startDate: new Date(),
        endDate: new Date(),
      };
      await reassignmentDb.insertReassignmentRequest(reassignmentRequest);
      expect(Reassignment.create).toHaveBeenCalledWith(reassignmentRequest);
    });
  });

  describe("getReassignmentRequest", () => {
    it("should return reassignment requests for a specific staffId", async () => {
      const staffId = 1;
      (Reassignment.find as jest.Mock).mockResolvedValue([{ staffId }]);
      const result = await reassignmentDb.getReassignmentRequest(staffId);
      expect(Reassignment.find).toHaveBeenCalledWith(
        { staffId },
        "-_id -createdAt -updatedAt",
      );
      expect(result).toEqual([{ staffId }]);
    });
  });

  describe("getTempMgrReassignmentRequest", () => {
    it("should return reassignment requests for a specific tempReportingManagerId", async () => {
      const staffId = 1;
      (Reassignment.find as jest.Mock).mockResolvedValue([{ tempReportingManagerId: staffId }]);
      const result = await reassignmentDb.getTempMgrReassignmentRequest(staffId);
      expect(Reassignment.find).toHaveBeenCalledWith(
        { tempReportingManagerId: staffId },
        "-_id -createdAt -updatedAt",
      );
      expect(result).toEqual([{ tempReportingManagerId: staffId }]);
    });
  });

  describe("getReassignmentActive", () => {
    it("should return an active reassignment request for a specific staffId and tempReportingManagerId", async () => {
      const staffId = 1;
      const tempReportingManagerId = 2;
      (Reassignment.findOne as jest.Mock).mockResolvedValue({
        staffId,
        tempReportingManagerId,
      });
      const result = await reassignmentDb.getReassignmentActive(
        staffId,
        tempReportingManagerId,
      );
      expect(Reassignment.findOne).toHaveBeenCalledWith(
        { staffId, tempReportingManagerId, active: true },
        "-_id -createdAt -updatedAt",
      );
      expect(result).toEqual({ staffId, tempReportingManagerId });
    });
  });

  describe("hasNonRejectedReassignment", () => {
    it("should return true if there is a non-rejected reassignment within the date range", async () => {
      const staffId = 1;
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-01-31");
      (Reassignment.exists as jest.Mock).mockResolvedValue(true);
      const result = await reassignmentDb.hasNonRejectedReassignment(
        staffId,
        startDate,
        endDate,
      );
      expect(Reassignment.exists).toHaveBeenCalledWith({
        staffId,
        status: { $ne: Status.REJECTED },
        $or: [
          { startDate: { $lte: endDate, $gte: startDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
        ],
      });
      expect(result).toBe(true);
    });
  });

  describe("getActiveReassignmentAsTempManager", () => {
    it("should return active reassignment for a temp manager", async () => {
      const staffId = 1;
      (Reassignment.findOne as jest.Mock).mockResolvedValue({
        tempReportingManagerId: staffId,
      });
      const result =
        await reassignmentDb.getActiveReassignmentAsTempManager(staffId);
      expect(Reassignment.findOne).toHaveBeenCalledWith(
        { tempReportingManagerId: staffId, active: true },
        "-_id -createdAt -updatedAt",
      );
      expect(result).toEqual({ tempReportingManagerId: staffId });
    });
  });
});
