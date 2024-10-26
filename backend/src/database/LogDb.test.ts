import Log from "@/models/Log";
import LogDb from "./LogDb";

jest.mock("@/models/Log", () => ({
  create: jest.fn(),
  aggregate: jest.fn(),
}));

describe("LogDb", () => {
  let logDb: LogDb;

  beforeEach(() => {
    logDb = new LogDb();
    jest.clearAllMocks();
  });

  describe("logAction", () => {
    it("should call Log.create with the correct logAction", async () => {
      const logAction = { action: "CREATE", performedBy: "User1" };
      await logDb.logAction(logAction);

      expect(Log.create).toHaveBeenCalledWith(logAction);
      expect(Log.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("getLogs", () => {
    it("should return formatted logs grouped by department and position", async () => {
      const mockLogData = [
        {
          dept: "HR",
          position: "Manager",
          logs: [
            {
              staffName: "John Doe",
              action: "CREATE",
              createdAt: new Date(),
              logId: 1,
            },
            {
              staffName: "Jane Doe",
              action: "UPDATE",
              createdAt: new Date(),
              logId: 2,
            },
          ],
        },
        {
          dept: "IT",
          position: "Developer",
          logs: [
            {
              staffName: "Jim Beam",
              action: "DELETE",
              createdAt: new Date(),
              logId: 3,
            },
          ],
        },
      ];

      (Log.aggregate as jest.Mock).mockResolvedValue(mockLogData);

      const result = await logDb.getLogs();

      expect(Log.aggregate).toHaveBeenCalledWith([
        {
          $project: {
            _id: 0,
            performedBy: 1,
            staffName: 1,
            requestId: 1,
            requestType: 1,
            action: 1,
            dept: 1,
            position: 1,
            reason: 1,
            createdAt: 1,
            logId: 1,
          },
        },
        {
          $group: {
            _id: {
              dept: "$dept",
              position: "$position",
            },
            logs: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            _id: 0,
            dept: "$_id.dept",
            position: "$_id.position",
            logs: 1,
          },
        },
      ]);

      // Check the result
      expect(result).toEqual({
        HR: {
          Manager: [
            {
              staffName: "John Doe",
              action: "CREATE",
              createdAt: expect.any(Date),
              logId: 1,
            },
            {
              staffName: "Jane Doe",
              action: "UPDATE",
              createdAt: expect.any(Date),
              logId: 2,
            },
          ],
        },
        IT: {
          Developer: [
            {
              staffName: "Jim Beam",
              action: "DELETE",
              createdAt: expect.any(Date),
              logId: 3,
            },
          ],
        },
      });
    });

    it("should return an empty object if there are no logs", async () => {
      // Mock the aggregate method to return an empty array
      (Log.aggregate as jest.Mock).mockResolvedValue([]);

      const result = await logDb.getLogs();

      expect(Log.aggregate).toHaveBeenCalled();
      expect(result).toEqual({});
    });
  });
});
