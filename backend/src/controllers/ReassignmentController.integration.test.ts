import { Action, errMsg } from "@/helpers";
import { app } from "@/index";
import Employee from "@/models/Employee";
import Reassignment from "@/models/Reassignment";
import { hashPassword } from "@/tests/utils";
import { readFileSync } from "fs";
import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import path from "path";
import request from "supertest";
import Log from "@/models/Log";

jest.mock("nodemailer");
jest.unmock("mongoose");
jest.unmock("@/models/Reassignment");
jest.unmock("@/models/Employee");
jest.unmock("@/models/Log");

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

describe("Reassignment Integration Tests", () => {
  let mongoServer: MongoMemoryServer;
  let mockServer: Server;

  const filePath = path.resolve("@/../script/reassignment.json");
  const fileContent = readFileSync(filePath, "utf-8");
  const reassignments = JSON.parse(fileContent);

  const filePath2 = path.resolve("@/../script/employee.json");
  const fileContent2 = readFileSync(filePath2, "utf-8");
  const employees = JSON.parse(fileContent2);

  const filePath3 = path.resolve("@/../script/log.json");
  const fileContent3 = readFileSync(filePath3, "utf-8");
  const logs = JSON.parse(fileContent3);

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
  }, 60000);

  describe("insertReassignmentRequest", () => {
    it("should not insert reassignment data to db if the date is today", async () => {
      const requestBody = {
        staffId: 140001,
        startDate: new Date(),
        endDate: "2024-11-28",
        tempReportingManagerId: 150008,
      };

      const response = await request(mockServer)
        .post("/api/v1/requestReassignment")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        errMsg: errMsg.CURRENT_DATE_NOT_ALLOWED,
      });
    });

    it("should not insert reassignment data to db if the date has passed", async () => {
      const requestBody = {
        staffId: 140001,
        startDate: new Date(Date.now() - 86400000),
        endDate: "2024-11-28",
        tempReportingManagerId: 150008,
      };

      const response = await request(mockServer)
        .post("/api/v1/requestReassignment")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        errMsg: errMsg.PAST_DATE_NOT_ALLOWED,
      });
    });

    it("should insert reassignment data to db if the date is tomorrow onwards", async () => {
      const requestBody = {
        staffId: 151408,
        startDate: new Date(Date.now() + 86400000),
        endDate: "2024-11-28",
        tempReportingManagerId: 130002,
      };

      const response = await request(mockServer)
        .post("/api/v1/requestReassignment")
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({});
    });
  });

  describe("getReassignmentStatus", () => {
    it("should return an error for if there is missing header", async () => {
      const response = await request(mockServer).get(
        "/api/v1/getReassignmentStatus",
      );

      expect(response.body).toEqual({ error: errMsg.MISSING_HEADER });
    });

    it("should return reassignment data for a valid staff id", async () => {
      const id = "140001";
      const expectedResponse = [
        {
          staffId: 140001,
          staffName: "Derek Tan",
          startDate: "2024-09-29T00:00:00.000Z",
          endDate: "2024-10-01T00:00:00.000Z",
          originalManagerDept: "Engineering",
          tempReportingManagerId: 150008,
          tempManagerName: "Eric",
          status: "PENDING",
          active: null,
          reassignmentId: 1,
        },
        {
          staffId: 140001,
          staffName: "Derek Tan",
          startDate: "2024-09-29T00:00:00.000Z",
          endDate: "2024-10-01T00:00:00.000Z",
          originalManagerDept: "Engineering",
          tempReportingManagerId: 151408,
          tempManagerName: "Philip Lee",
          status: "PENDING",
          active: null,
          reassignmentId: 2,
        },
      ];

      const response = await request(mockServer)
        .get("/api/v1/getReassignmentStatus")
        .set("id", id)
        .expect(200);

      expect(response.body).toStrictEqual(expectedResponse);
    });
  });

  describe("getTempMgrReassignmentStatus", () => {
    it("should return an error if the header id is missing", async () => {
      const response = await request(mockServer).get(
        "/api/v1/getTempMgrReassignmentStatus",
      );
      expect(response.body).toEqual({ error: errMsg.MISSING_HEADER });
    });
  });

  describe("getIncomingReassignmentRequests", () => {
    it("should return an error if the header id is missing", async () => {
      const response = await request(mockServer).get(
        "/api/v1/getIncomingReassignmentRequests",
      );

      expect(response.body).toEqual({ error: errMsg.MISSING_HEADER });
    });

    it("should return incoming reassignment requests for a valid staff id", async () => {
      const id = "150008";
      const expectedResponse = [
        {
          active: null,
          endDate: "2024-10-01T00:00:00.000Z",
          originalManagerDept: "Engineering",
          reassignmentId: 1,
          staffId: 140001,
          staffName: "Derek Tan",
          startDate: "2024-09-29T00:00:00.000Z",
          status: "PENDING",
          tempManagerName: "Eric",
          tempReportingManagerId: 150008,
        },
      ];

      const response = await request(mockServer)
        .get("/api/v1/getIncomingReassignmentRequests")
        .set("id", id)
        .expect(200);

      const filteredResponse = response.body.map(
        ({ createdAt, updatedAt, ...rest }: any) => rest,
      );

      expect(filteredResponse).toStrictEqual(expectedResponse);
    });
  });

  describe("handleReassignmentRequest", () => {
    it("should return an error if the header id is missing", async () => {
      const response = await request(mockServer)
        .post("/api/v1/handleReassignmentRequest")
        .send({ reassignmentId: 1, action: "APPROVE" });

      expect(response.body).toEqual({ error: errMsg.MISSING_HEADER });
    });

    it("should return an error if reassignmentId or action is missing", async () => {
      const id = "150008";

      const response1 = await request(mockServer)
        .post("/api/v1/handleReassignmentRequest")
        .set("id", id)
        .send({ action: "APPROVE" });

      expect(response1.body).toEqual({ error: errMsg.MISSING_PARAMETERS });

      const response2 = await request(mockServer)
        .post("/api/v1/handleReassignmentRequest")
        .set("id", id)
        .send({ reassignmentId: 1 });

      expect(response2.body).toEqual({ error: errMsg.MISSING_PARAMETERS });
    });

    it("should return an error for an invalid action", async () => {
      const id = "150008";

      const response = await request(mockServer)
        .post("/api/v1/handleReassignmentRequest")
        .set("id", id)
        .send({ reassignmentId: 1, action: "INVALID_ACTION" });

      expect(response.body).toEqual({ error: errMsg.INVALID_ACTION });
    });

    it("should successfully handle a reassignment request with APPROVE action", async () => {
      const id = "150008";

      const response = await request(mockServer)
        .post("/api/v1/handleReassignmentRequest")
        .set("id", id)
        .send({ reassignmentId: 1, action: Action.APPROVE });
      expect(response.status).toBe(200);
    });

    it("should successfully handle a reassignment request with REJECT action", async () => {
      const id = "150008";

      const response = await request(mockServer)
        .post("/api/v1/handleReassignmentRequest")
        .set("id", id)
        .send({ reassignmentId: 1, action: Action.REJECT });
      expect(response.status).toBe(200);
    });
  });

  describe("getSubordinateRequestsForTempManager", () => {
    it("should return an error if the header id is missing", async () => {
      const response = await request(mockServer).get(
        "/api/v1/getSubordinateRequestsForTempManager",
      );

      expect(response.body).toEqual({ error: errMsg.MISSING_HEADER });
    });

    it("should return an error if no active reassignments are found", async () => {
      const id = "150008";

      const response = await request(mockServer)
        .get("/api/v1/getSubordinateRequestsForTempManager")
        .set("id", id);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: errMsg.NO_ACTIVE_REASSIGNMENT });
    });
  });
});
