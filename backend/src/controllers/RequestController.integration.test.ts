import { errMsg, HttpStatusResponse, Status, successMsg } from "@/helpers";
import { app } from "@/index";
import Employee from "@/models/Employee";
import Log from "@/models/Log";
import Request from "@/models/Request";
import { hashPassword } from "@/tests/utils";
import { readFileSync } from "fs";
import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import path from "path";
import request from "supertest";

jest.mock("nodemailer");
jest.unmock("mongoose");
jest.unmock("@/models/Request");
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

describe("Request Integration Test", () => {
  let mongoServer: MongoMemoryServer;
  let mockServer: Server;

  const requestFilePath = path.resolve("@/../script/request.json");
  const requestFileContent = readFileSync(requestFilePath, "utf-8");
  const requests = JSON.parse(requestFileContent);

  const employeeFilePath = path.resolve("@/../script/employee.json");
  const employeeFileContent = readFileSync(employeeFilePath, "utf-8");
  const employees = JSON.parse(employeeFileContent);

  const logFilePath = path.resolve("@/../script/log.json");
  const logFileContent = readFileSync(logFilePath, "utf-8");
  const logs = JSON.parse(logFileContent);

  beforeAll(async () => {
    mockCounter.seq = 1;

    const mockTransporter = { verify: jest.fn((cb) => cb(null, true)) };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

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
    mockCounter.seq = 1;

    await Employee.deleteMany();
    const EMPLOYEE_LIMIT = 10;
    for (let i = 0; i < Math.min(EMPLOYEE_LIMIT, employees.length); i++) {
      const employeeData = employees[i];
      employeeData.hashedPassword = await hashPassword("password123");
      await Employee.create(employeeData);
    }

    mockCounter.seq = 1;
    await Log.deleteMany();
    const LOG_LIMIT = 10;
    for (let i = 0; i < Math.min(LOG_LIMIT, logs.length); i++) {
      const logData = logs[i];
      await Log.create(logData);
    }

    mockCounter.seq = 1;

    await Request.deleteMany();
    const REQUEST_LIMIT = 10;
    for (let i = 0; i < Math.min(REQUEST_LIMIT, requests.length); i++) {
      const requestData = requests[i];
      await Request.create(requestData);
    }
  }, 60000);

  describe("cancelPendingRequests", () => {
    it("should successfully cancel a pending request and return OK when valid staffId and requestId are provided", async () => {
      const requestBody = {
        staffId: 140001,
        requestId: 1,
      };

      const response = await request(mockServer)
        .post("/api/v1/cancelPendingRequests")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.text).toStrictEqual(HttpStatusResponse.OK);
    });

    it("should return NOT_MODIFIED if no pending request is found for given staffId and requestId", async () => {
      const requestBody = {
        staffId: 140001,
        requestId: 2,
      };

      const response = await request(mockServer)
        .post("/api/v1/cancelPendingRequests")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.text).toStrictEqual(HttpStatusResponse.NOT_MODIFIED);
    });
  });

  describe("getAllSubordinatesRequests", () => {
    it("should return all requests for the given subordinate ID", async () => {
      const subordinateId = 140001;
      const expectedRequests = await Request.find({
        employeeId: subordinateId,
      });

      const response = await request(mockServer)
        .get("/api/v1/getAllSubordinatesRequests")
        .set("id", subordinateId.toString());

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.arrayContaining(expectedRequests));
    });

    it("should return an empty array if no requests are found for the given subordinate ID", async () => {
      const nonExistentId = 9999;
      const response = await request(mockServer)
        .get("/api/v1/getAllSubordinatesRequests")
        .set("id", nonExistentId.toString());

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        error: errMsg.USER_DOES_NOT_EXIST,
      });
    });
  });

  describe("getOwnPendingRequests", () => {
    it("should return pending requests for the given user ID", async () => {
      const userId = 140001;
      const expectedPendingRequests = await Request.find({
        employeeId: userId,
        status: Status.PENDING,
      });

      const response = await request(mockServer)
        .get("/api/v1/getOwnPendingRequests")
        .query({ myId: userId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining(expectedPendingRequests),
      );
    });

    it("should return an error if myId is missing", async () => {
      const response = await request(mockServer).get(
        "/api/v1/getOwnPendingRequests",
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("error", errMsg.MISSING_PARAMETERS);
    });

    it("should return an empty array if no pending requests are found for the given user id", async () => {
      const nonExistentUserId = 9999;
      const response = await request(mockServer)
        .get("/api/v1/getOwnPendingRequests")
        .query({ myId: nonExistentUserId });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("getMySchedule", () => {
    it("should return the schedule for the given user id", async () => {
      const userId = 140001;
      const expectedSchedule = await Request.find({ staffId: userId });

      const response = await request(mockServer)
        .get("/api/v1/getMySchedule")
        .query({ myId: userId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(expectedSchedule.length);
    });

    it("should return an error if myId is missing", async () => {
      const response = await request(mockServer).get("/api/v1/getMySchedule");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("error", errMsg.MISSING_PARAMETERS);
    });
  });

  describe("getSchedule", () => {
    it("should return the schedule for the given staffId", async () => {
      const staffId = 140001;
      const expectedSchedule = {
        CEO: { teams: { MD: 1 }, wfhStaff: [] },
        Engineering: { teams: { Director: 1 }, wfhStaff: [] },
        Sales: {
          teams: { "Account Manager": 5, Director: 1, "Sales Manager": 1 },
          wfhStaff: [
            {
              dept: "Sales",
              managerName: "Jack Sim",
              position: "Director",
              reason: "Apple Launch Day",
              reportingManager: 130002,
              requestId: 2,
              requestType: "AM",
              requestedDate: "2024-12-15T00:00:00.000Z",
              staffId: 140001,
              staffName: "Derek Tan",
              status: "APPROVED",
            },
          ],
        },
        Solutioning: { teams: { Director: 1 }, wfhStaff: [] },
      };

      const response = await request(mockServer)
        .get("/api/v1/getSchedule")
        .set("id", staffId.toString());

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedSchedule);
    });

    it("should return an empty object if no schedule is found for the given staff ID", async () => {
      const nonExistentStaffId = 9999;
      const response = await request(mockServer)
        .get("/api/v1/getSchedule")
        .set("id", nonExistentStaffId.toString());

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });
  });

  describe("approveRequest", () => {
    it("should approve the request and return OK for valid approval details", async () => {
      const approvalDetails = {
        performedBy: 130002,
        requestId: 1,
      };

      const response = await request(mockServer)
        .post("/api/v1/approveRequest")
        .send(approvalDetails);

      expect(response.status).toBe(200);
      expect(response.text).toBe(HttpStatusResponse.OK);
    });

    it("should return an error if approval details are invalid", async () => {
      const invalidApprovalDetails = {
        performedBy: "invalid-id",
        requestId: null,
      };

      const response = await request(mockServer)
        .post("/api/v1/approveRequest")
        .send(invalidApprovalDetails);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("errMsg");
    });

    it("should return NOT_MODIFIED if the requestId is invalid", async () => {
      const approvalDetails = {
        performedBy: 140001,
        requestId: 99999,
      };

      const response = await request(mockServer)
        .post("/api/v1/approveRequest")
        .send(approvalDetails);

      expect(response.status).toBe(200);
      expect(response.text).toBe(HttpStatusResponse.NOT_MODIFIED);
    });
  });

  describe("rejectRequest", () => {
    it("should reject the request for valid rejection details", async () => {
      const rejectionDetails = {
        performedBy: 140001,
        requestId: 12345,
        reason: "Not required anymore",
      };

      const response = await request(mockServer)
        .post("/api/v1/rejectRequest")
        .send(rejectionDetails);

      expect(response.status).toBe(200);
      expect(response.text).toBe(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return an error if rejection details are invalid", async () => {
      const invalidRejectionDetails = {
        performedBy: "invalid-id",
        requestId: null,
        reason: "",
      };

      const response = await request(mockServer)
        .post("/api/v1/rejectRequest")
        .send(invalidRejectionDetails);

      const expectedResponse = {
        errMsg: {
          _errors: [],
          performedBy: {
            _errors: ["Expected number, received string"],
          },
          requestId: {
            _errors: ["Expected number, received null"],
          },
        },
      };

      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toStrictEqual(expectedResponse);
    });

    it("should return NOT_MODIFIED if the requestId is invalid", async () => {
      const rejectionDetails = {
        performedBy: 140001,
        requestId: 99999,
        reason: "Request is invalid",
      };

      const response = await request(mockServer)
        .post("/api/v1/rejectRequest")
        .send(rejectionDetails);

      expect(response.status).toBe(200);
      expect(response.text).toBe(HttpStatusResponse.NOT_MODIFIED);
    });
  });

  describe("revokeRequest", () => {
    it("should return NOT_MODIFIED if the requestId is invalid", async () => {
      const revocationDetails = {
        performedBy: 140001,
        requestId: 12345,
        reason: "No longer needed",
      };

      const response = await request(mockServer)
        .post("/api/v1/revokeRequest")
        .send(revocationDetails);

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return an error if revocation details are invalid", async () => {
      const invalidRevocationDetails = {
        performedBy: "invalid-id",
        requestId: null,
        reason: "",
      };

      const response = await request(mockServer)
        .post("/api/v1/revokeRequest")
        .send(invalidRevocationDetails);

      const expectedResponse = {
        errMsg: {
          _errors: [],
          performedBy: {
            _errors: ["Expected number, received string"],
          },
          requestId: {
            _errors: ["Expected number, received null"],
          },
        },
      };

      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toStrictEqual(expectedResponse);
    });

    it("should return NOT_MODIFIED if the request could not be revoked", async () => {
      const revocationDetails = {
        performedBy: 140001,
        requestId: 99999,
        reason: "Request is invalid",
      };

      const response = await request(mockServer)
        .post("/api/v1/revokeRequest")
        .send(revocationDetails);

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });
  });

  describe("postRequest", () => {
    it("should return success message for valid request details", async () => {
      const requestDetails = {
        staffId: 140001,
        staffName: "Derek Tan",
        reportingManager: 140894,
        managerName: "Rahim Khalid",
        dept: "Sales",
        requestedDates: [
          ["2024-11-25", "AM"],
          ["2024-11-26", "PM"],
        ],
        reason: "Apple Launch Day",
      };

      const response = await request(mockServer)
        .post("/api/v1/postRequest")
        .send(requestDetails);

      expect(response.status).toBe(200);
      expect(response.body.success.message).toBe(successMsg);
      expect(response.body.success.dates).toEqual(expect.any(Array));
    });

    it("should return an error if request details are invalid", async () => {
      const invalidRequestDetails = {
        staffId: null,
        staffName: "",
        reportingManager: 140894,
        managerName: "Rahim Khalid",
        dept: "Sales",
        requestedDates: [["invalid-date", "AM"]],
        reason: "",
      };

      const response = await request(mockServer)
        .post("/api/v1/postRequest")
        .send(invalidRequestDetails);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("errMsg");
    });

    it("should return error messages for requests with weekend dates", async () => {
      const requestDetails = {
        staffId: 140001,
        staffName: "Derek Tan",
        reportingManager: 140894,
        managerName: "Rahim Khalid",
        dept: "Sales",
        requestedDates: [
          ["2024-11-02", "AM"],
          ["2024-11-03", "PM"],
        ],
        reason: "Weekend Request",
      };

      const response = await request(mockServer)
        .post("/api/v1/postRequest")
        .send(requestDetails);

      expect(response.status).toBe(200);
      expect(response.body.error).toEqual(
        expect.arrayContaining([
          {
            message: errMsg.WEEKEND_REQUEST,
            dates: expect.any(Array),
          },
        ]),
      );
    });

    it("should return error messages for requests with past dates", async () => {
      const requestDetails = {
        staffId: 140001,
        staffName: "Derek Tan",
        reportingManager: 140894,
        managerName: "Rahim Khalid",
        dept: "Sales",
        requestedDates: [["2020-01-01", "AM"]],
        reason: "Past Date Request",
      };

      const response = await request(mockServer)
        .post("/api/v1/postRequest")
        .send(requestDetails);

      expect(response.status).toBe(200);
      expect(response.body.error).toEqual(
        expect.arrayContaining([
          {
            message: errMsg.PAST_DATE,
            dates: expect.any(Array),
          },
        ]),
      );
    });

    it("should return error messages for requests with duplicate dates", async () => {
      const requestDetails = {
        staffId: 140001,
        staffName: "Derek Tan",
        reportingManager: 140894,
        managerName: "Rahim Khalid",
        dept: "Sales",
        requestedDates: [
          ["2024-11-01", "AM"],
          ["2024-11-01", "AM"],
        ],
        reason: "Duplicate Date Request",
      };

      const response = await request(mockServer)
        .post("/api/v1/postRequest")
        .send(requestDetails);

      expect(response.status).toBe(200);
      expect(response.body.error).toEqual(
        expect.arrayContaining([
          {
            message: errMsg.DUPLICATE_DATE,
            dates: expect.any(Array),
          },
        ]),
      );
    });
  });
});
