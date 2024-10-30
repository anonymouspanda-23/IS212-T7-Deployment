import { Action, errMsg, Request } from "@/helpers";
import { app } from "@/index";
import Employee from "@/models/Employee";
import Log from "@/models/Log";
import { hashPassword } from "@/tests/utils";
import { readFileSync } from "fs";
import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import path from "path";
import request from "supertest";

jest.mock("nodemailer");
jest.unmock("mongoose");
jest.unmock("@/models/Log");
jest.unmock("@/models/Employee");

const mockCounter = {
  seq: 1,
};

jest.mock("@/helpers/counter", () => ({
  Counter: {
    findByIdAndUpdate: jest.fn(() => {
      return Promise.resolve({ seq: mockCounter.seq++ });
    }),
  },
  initializeCounter: jest.fn(() => Promise.resolve()),
}));

describe("Log Integration Test", () => {
  let mongoServer: MongoMemoryServer;
  let mockServer: Server;

  const employeeFilePath = path.resolve("@/../script/employee.json");
  const employeeFileContent = readFileSync(employeeFilePath, "utf-8");
  const employees = JSON.parse(employeeFileContent);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
    mockServer = app.listen();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    mockServer.close();
  });

  beforeEach(async () => {
    await Employee.deleteMany();
    const EMPLOYEE_LIMIT = 10;
    for (let i = 0; i < Math.min(EMPLOYEE_LIMIT, employees.length); i++) {
      const employeeData = employees[i];
      employeeData.hashedPassword = await hashPassword("password123");
      await Employee.create(employeeData);
    }

    await Log.deleteMany();
    const logs = [
      {
        logId: 1,
        performedBy: 140001,
        staffName: "Derek Tan",
        dept: "Sales",
        position: "Sales Manager",
        reportingManagerId: 140894,
        managerName: "Rahim Khalid",
        requestId: 1,
        requestType: Request.APPLICATION,
        action: Action.APPLY,
        reason: "Request for annual leave.",
      },
      {
        logId: 2,
        performedBy: 140001,
        staffName: "Derek Tan",
        dept: "Sales",
        position: "Sales Manager",
        reportingManagerId: 140894,
        managerName: "Rahim Khalid",
        requestId: 2,
        requestType: Request.WITHDRAWAL,
        action: Action.CANCEL,
        reason: "Cancelled due to personal reasons.",
      },
      {
        logId: 3,
        performedBy: 140002,
        staffName: "Jane Doe",
        dept: "Engineering",
        position: "Software Engineer",
        reportingManagerId: 140895,
        managerName: "John Smith",
        requestId: 3,
        requestType: Request.REASSIGNMENT,
        action: Action.REASSIGN,
        reason: null,
      },
      {
        logId: 4,
        performedBy: 140003,
        staffName: "Alice Johnson",
        dept: "HR",
        position: "HR Manager",
        reportingManagerId: 140896,
        managerName: "Susan Lee",
        requestId: 4,
        requestType: Request.APPLICATION,
        action: Action.APPROVE,
        reason: "Approved after review.",
      },
    ];
    await Log.insertMany(logs);
  });

  describe("getAllLogs", () => {
    it("should return all logs for the given staff ID", async () => {
      const staffId = 140001;
      const response = await request(mockServer)
        .get("/api/v1/getAllLogs")
        .set("id", staffId.toString());

      const expectedResult = {
        Engineering: {
          "Software Engineer": [
            {
              action: "REASSIGN",
              dept: "Engineering",
              logId: 3,
              performedBy: 140002,
              position: "Software Engineer",
              reason: null,
              requestId: 3,
              requestType: "REASSIGNMENT",
              staffName: "Jane Doe",
            },
          ],
        },
        HR: {
          "HR Manager": [
            {
              action: "APPROVE",
              dept: "HR",
              logId: 4,
              performedBy: 140003,
              position: "HR Manager",
              reason: "Approved after review.",
              requestId: 4,
              requestType: "APPLICATION",
              staffName: "Alice Johnson",
            },
          ],
        },
        Sales: {
          "Sales Manager": [
            {
              action: "APPLY",
              dept: "Sales",
              logId: 1,
              performedBy: 140001,
              position: "Sales Manager",
              reason: "Request for annual leave.",
              requestId: 1,
              requestType: "APPLICATION",
              staffName: "Derek Tan",
            },
            {
              action: "CANCEL",

              dept: "Sales",
              logId: 2,
              performedBy: 140001,
              position: "Sales Manager",
              reason: "Cancelled due to personal reasons.",
              requestId: 2,
              requestType: "WITHDRAWAL",
              staffName: "Derek Tan",
            },
          ],
        },
      };
      expect(response.status).toBe(200);
      const stripCreatedAtField = (logs: any) => {
        return logs.map(({ createdAt, ...rest }: any) => rest);
      };

      const normalizedResponseBody: any = {};
      Object.entries(response.body).forEach(([dept, positions]) => {
        normalizedResponseBody[dept] = {};
        Object.entries(positions as any).forEach(([position, logs]) => {
          normalizedResponseBody[dept][position] = stripCreatedAtField(logs);
        });
      });

      expect(normalizedResponseBody).toEqual(expectedResult);
    });

    it("should return an error if no id is provided in the header", async () => {
      const response = await request(mockServer).get("/api/v1/getAllLogs");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ error: errMsg.MISSING_HEADER });
    });

    it("should return an empty object if no logs are found for the given staff id", async () => {
      const noLogsStaffId = 140025;
      const response = await request(mockServer)
        .get("/api/v1/getAllLogs")
        .set("id", noLogsStaffId.toString());

      const expectedResult = {
        Sales: {
          "Account Manager": [],
        },
      };

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedResult);
    });
  });
});
