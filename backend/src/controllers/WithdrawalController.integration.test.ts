import { errMsg, HttpStatusResponse } from "@/helpers";
import { app } from "@/index";
import Log from "@/models/Log";
import Employee from "@/models/Employee";
import Reassignment from "@/models/Reassignment";
import Request from "@/models/Request";
import Withdrawal from "@/models/Withdrawal";
import { withdrawalApprovalSchema, withdrawalRejectionSchema } from "@/schema";
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
jest.unmock("@/models/Log");
jest.unmock("@/models/Withdrawal");
jest.unmock("@/models/Request");
jest.unmock("@/models/Employee");
jest.unmock("@/models/Reassignment");

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

describe("Withdrawal Integration Tests", () => {
  let mongoServer: MongoMemoryServer;
  let mockServer: Server;

  const filePath = path.resolve("@/../script/withdrawal.json");
  const fileContent = readFileSync(filePath, "utf-8");
  const withdrawals = JSON.parse(fileContent);

  const filePath2 = path.resolve("@/../script/request.json");
  const fileContent2 = readFileSync(filePath2, "utf-8");
  const requests = JSON.parse(fileContent2);

  const filePath3 = path.resolve("@/../script/employee.json");
  const fileContent3 = readFileSync(filePath3, "utf-8");
  const employees = JSON.parse(fileContent3);

  const filePath4 = path.resolve("@/../script/reassignment.json");
  const fileContent4 = readFileSync(filePath4, "utf-8");
  const reassignments = JSON.parse(fileContent4);

  const filePath5 = path.resolve("@/../script/log.json");
  const fileContent5 = readFileSync(filePath5, "utf-8");
  const logs = JSON.parse(fileContent5);

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
    await Request.deleteMany();
    const REQUEST_LIMIT = 10;
    for (let i = 0; i < Math.min(REQUEST_LIMIT, requests.length); i++) {
      const requestData = requests[i];
      requestData.requestedDate = new Date(requestData.requestedDate);
      await Request.create(requestData);
    }

    mockCounter.seq = 1;
    await Log.deleteMany();
    const LOG_LIMIT = 10;
    for (let i = 0; i < Math.min(LOG_LIMIT, logs.length); i++) {
      const logData = logs[i];
      await Log.create(logData);
    }

    mockCounter.seq = 1;
    await Reassignment.deleteMany();
    const REASSIGNMENT_LIMIT = 10;
    for (
      let i = 0;
      i < Math.min(REASSIGNMENT_LIMIT, reassignments.length);
      i++
    ) {
      const reassignmentData = reassignments[i];
      reassignmentData.startDate = new Date(reassignmentData.startDate);
      reassignmentData.endDate = new Date(reassignmentData.endDate);
      await Reassignment.create(reassignmentData);
    }

    mockCounter.seq = 1;
    await Withdrawal.deleteMany();
    const WITHDRAWAL_LIMIT = 10;
    for (let i = 0; i < Math.min(WITHDRAWAL_LIMIT, withdrawals.length); i++) {
      const withdrawalData = withdrawals[i];
      withdrawalData.requestedDate = new Date(withdrawalData.requestedDate);
      await Withdrawal.create(withdrawalData);
    }
  }, 60000);

  describe("withdrawRequest", () => {
    it("should return Missing Parameters if missing requestId", async () => {
      const requestBody = {};
      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ error: errMsg.MISSING_PARAMETERS });
    });

    it("should return HttpStatusResponse.NOT_MODIFIED if invalid requestId", async () => {
      const requestBody = {
        requestId: 25,
      };
      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.NOT_MODIFIED if request is pending", async () => {
      const requestBody = {
        requestId: 3,
      };
      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.NOT_MODIFIED if there is an existing pending withdrawal", async () => {
      const requestBody = {
        requestId: 3,
      };
      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      await Request.findOneAndUpdate({ requestId: 3 }, { status: "APPROVED" });

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.NOT_MODIFIED if there is an existing approved withdrawal", async () => {
      const requestBody = {
        requestId: 3,
      };
      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      await Request.findOneAndUpdate({ requestId: 3 }, { status: "APPROVED" });
      await Withdrawal.findOneAndUpdate(
        { requestId: 3 },
        { status: "APPROVED" },
      );

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.NOT_MODIFIED for a request with past date", async () => {
      const requestBody = {
        requestId: 4,
      };
      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      await Request.findOneAndUpdate({ requestId: 4 }, { status: "APPROVED" });

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.NOT_MODIFIED for a request with today's date", async () => {
      const requestBody = {
        requestId: 4,
      };
      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      await Request.findOneAndUpdate(
        { requestId: 4 },
        { status: "APPROVED" },
        { requestedDate: new Date() },
      );

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.OK for a request with tomorrow's date", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const requestBody = {
        requestId: 5,
      };

      await Request.findOneAndUpdate(
        { requestId: 5 },
        {
          status: "APPROVED",
          requestedDate: tomorrow,
        },
      );

      const response = await request(mockServer)
        .post("/api/v1/withdrawRequest")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.text).toEqual(HttpStatusResponse.OK);
    });
  });

  describe("getSubordinatesWithdrawalRequests", () => {
    it("should return an error for an invalid staffId", async () => {
      const id = "1234";
      const response = await request(mockServer)
        .get("/api/v1/getSubordinatesWithdrawalRequests")
        .set("id", id)
        .expect(200);
      expect(response.body).toEqual({
        error: errMsg.USER_DOES_NOT_EXIST,
      });
    });

    it("should return an error for if there is missing header", async () => {
      const response = await request(mockServer).get(
        "/api/v1/getSubordinatesWithdrawalRequests",
      );
      expect(response.body).toEqual({ error: errMsg.MISSING_HEADER });
    });

    it("should return withdrawal data for a valid staff id", async () => {
      const id = "151408";
      const expectedResponse = [
        {
          requestId: 3,
          staffId: 150245,
          staffName: "Benjamin Tan",
          reportingManager: 151408,
          managerName: "Philip Lee",
          dept: "Engineering",
          position: "Call Centre",
          reason: "Plans cancelled",
          requestedDate: "2024-09-15T00:00:00.000Z",
          requestType: "AM",
          withdrawalId: 2,
          status: "PENDING",
        },
      ];

      const response = await request(mockServer)
        .get("/api/v1/getSubordinatesWithdrawalRequests")
        .set("id", id)
        .expect(200);

      const filteredResponse = response.body.map(
        ({ createdAt, updatedAt, _id, ...rest }: any) => rest,
      );

      expect(filteredResponse).toStrictEqual(expectedResponse);
    });

    it("should return withdrawal + temp withdrawal data for a valid staff id and active reassignment", async () => {
      await Reassignment.findOneAndUpdate(
        { tempReportingManagerId: 151408 },
        {
          status: "APPROVED",
          active: true,
        },
      );
      const expectedResponse = [
        {
          requestId: 3,
          staffId: 150245,
          staffName: "Benjamin Tan",
          reportingManager: 151408,
          managerName: "Philip Lee",
          dept: "Engineering",
          position: "Call Centre",
          reason: "Plans cancelled",
          requestedDate: "2024-09-15T00:00:00.000Z",
          requestType: "AM",
          withdrawalId: 2,
          status: "PENDING",
        },
        {
          requestId: 6,
          staffId: 140008,
          staffName: "Jaclyn Lee",
          reportingManager: 140001,
          managerName: "Derek Tan",
          dept: "Sales",
          position: "Sales Manager",
          requestedDate: "2024-09-18T00:00:00.000Z",
          reason: "Plans cancelled",
          requestType: "AM",
          withdrawalId: 3,
          status: "PENDING",
        },
      ];
      const id = "151408";
      const response = await request(mockServer)
        .get("/api/v1/getSubordinatesWithdrawalRequests")
        .set("id", id)
        .expect(200);

      const filteredResponse = response.body.map(
        ({ createdAt, updatedAt, _id, ...rest }: any) => rest,
      );

      expect(filteredResponse).toStrictEqual(expectedResponse);
    });
  });

  describe("getOwnWithdrawalRequests", () => {
    it("should return [] for an invalid staffId", async () => {
      const staffId = "1234";
      const response = await request(mockServer)
        .get(`/api/v1/getOwnWithdrawalRequests?staffId=${staffId}`)
        .expect(200);
      expect(response.body).toEqual([]);
    });

    it("should return an error for if there is missing staffId", async () => {
      const response = await request(mockServer)
        .get(`/api/v1/getOwnWithdrawalRequests`)
        .expect(200);
      expect(response.body).toEqual({ error: errMsg.MISSING_PARAMETERS });
    });

    it("should return withdrawal data for a valid staffId", async () => {
      const staffId = "150245";
      const response = await request(mockServer)
        .get(`/api/v1/getOwnWithdrawalRequests?staffId=${staffId}`)
        .expect(200);
      const filteredResponse = response.body.map(
        ({ createdAt, updatedAt, _id, ...rest }: any) => rest,
      );
      const expectedResponse = [
        {
          requestId: 3,
          staffId: 150245,
          staffName: "Benjamin Tan",
          reportingManager: 151408,
          managerName: "Philip Lee",
          dept: "Engineering",
          position: "Call Centre",
          reason: "Plans cancelled",
          requestedDate: "2024-09-15T00:00:00.000Z",
          requestType: "AM",
          withdrawalId: 2,
          status: "PENDING",
        },
      ];
      expect(filteredResponse).toStrictEqual(expectedResponse);
    });
  });

  describe("approveWithdrawalRequest", () => {
    it("should return error for missing performedBy / withdrawalId", async () => {
      const response = await request(mockServer)
        .post(`/api/v1/approveWithdrawalRequest`)
        .expect(200);
      const validation = withdrawalApprovalSchema.safeParse(response);
      expect(response.body).toEqual({ errMsg: validation!.error!.format() });
    });

    it("should return HttpStatusResponse.NOT_MODIFIED for invalid withdrawalId", async () => {
      const requestBody = {
        performedBy: 151408,
        withdrawalId: 555,
      };
      const response = await request(mockServer)
        .post("/api/v1/approveWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.NOT_MODIFIED for invalid performedby", async () => {
      const requestBody = {
        performedBy: 777,
        withdrawalId: 2,
      };
      const response = await request(mockServer)
        .post("/api/v1/approveWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.OK for valid performedby & withdrawalId", async () => {
      const requestBody = {
        performedBy: 151408,
        withdrawalId: 2,
      };
      const currentWithdrawal = await Withdrawal.findOne({ withdrawalId: 2 });
      await Request.findOneAndUpdate(
        {
          requestId: currentWithdrawal!.requestId,
        },
        {
          status: "APPROVED",
        },
      );

      const response = await request(mockServer)
        .post("/api/v1/approveWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.OK);
    });

    it("should return HttpStatusResponse.OK for valid performedby (temp) & withdrawalId", async () => {
      const requestBody = {
        performedBy: 151408,
        withdrawalId: 3,
      };
      await Reassignment.findOneAndUpdate(
        { tempReportingManagerId: 151408 },
        {
          status: "APPROVED",
          active: true,
        },
      );
      const currentWithdrawal = await Withdrawal.findOne({
        withdrawalId: 3,
      });
      await Request.findOneAndUpdate(
        {
          requestId: currentWithdrawal!.requestId,
        },
        {
          status: "APPROVED",
        },
      );

      const response = await request(mockServer)
        .post("/api/v1/approveWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.OK);
    });
  });

  describe("rejectWithdrawalRequest", () => {
    it("should return error for missing performedBy / withdrawalId / reason", async () => {
      const response = await request(mockServer)
        .post(`/api/v1/rejectWithdrawalRequest`)
        .expect(200);
      const validation = withdrawalRejectionSchema.safeParse(response);
      expect(response.body).toEqual({ errMsg: validation!.error!.format() });
    });

    it("should return HttpStatusResponse.NOT_MODIFIED for invalid withdrawalId", async () => {
      const requestBody = {
        performedBy: 151408,
        withdrawalId: 555,
        reason: "stay home",
      };
      const response = await request(mockServer)
        .post("/api/v1/rejectWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.NOT_MODIFIED for invalid performedby", async () => {
      const requestBody = {
        performedBy: 777,
        withdrawalId: 2,
        reason: "stay home",
      };
      const response = await request(mockServer)
        .post("/api/v1/rejectWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.NOT_MODIFIED);
    });

    it("should return HttpStatusResponse.OK for valid performedby & withdrawalId & reason", async () => {
      const requestBody = {
        performedBy: 151408,
        withdrawalId: 2,
        reason: "stay home",
      };
      const currentWithdrawal = await Withdrawal.findOne({ withdrawalId: 2 });
      await Request.findOneAndUpdate(
        {
          requestId: currentWithdrawal!.requestId,
        },
        {
          status: "APPROVED",
        },
      );

      const response = await request(mockServer)
        .post("/api/v1/rejectWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.OK);
    });

    it("should return HttpStatusResponse.OK for valid performedby (temp) & withdrawalId & reason", async () => {
      const requestBody = {
        performedBy: 151408,
        withdrawalId: 3,
        reason: "stay home",
      };
      await Reassignment.findOneAndUpdate(
        { tempReportingManagerId: 151408 },
        {
          status: "APPROVED",
          active: true,
        },
      );
      const currentWithdrawal = await Withdrawal.findOne({
        withdrawalId: 3,
      });
      await Request.findOneAndUpdate(
        {
          requestId: currentWithdrawal!.requestId,
        },
        {
          status: "APPROVED",
        },
      );

      const response = await request(mockServer)
        .post("/api/v1/rejectWithdrawalRequest")
        .send(requestBody)
        .expect(200);
      expect(response.text).toEqual(HttpStatusResponse.OK);
    });
  });
});
